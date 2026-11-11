package com.webappfoundation.kathaa.service;

import com.webappfoundation.connector.builtin.EmailConnector;
import com.webappfoundation.connector.demo.DemoRefundConnector;
import com.webappfoundation.dto.WorkflowDto;
import com.webappfoundation.kathaa.catalog.KathaaTypes;
import com.webappfoundation.kathaa.model.*;
import com.webappfoundation.kathaa.repo.*;
import com.webappfoundation.model.Branch;
import com.webappfoundation.model.RefundPolicy;
import com.webappfoundation.model.Workflow;
import com.webappfoundation.repository.BranchRepository;
import com.webappfoundation.repository.WorkflowRepository;
import com.webappfoundation.service.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Idempotent startup seed for Cafe Kathaa: the two workflows this cafe actually runs (table bookings and
 * counter takeaway), the FC Road branch, and starter content (menu, seating areas, shelf, story) that the owner
 * edits in /admin. Runs after the foundation's workflow seed (@Order 0) and before the loyalty binding (@Order 50)
 * and sprint bootstrap (@Order 100), so both new workflows get loyalty connectors and an active sprint.
 */
@Component
public class KathaaSeeder {

    private static final Logger log = LoggerFactory.getLogger(KathaaSeeder.class);

    private final WorkflowRepository workflowRepository;
    private final WorkflowService workflowService;
    private final BranchRepository branchRepository;
    private final MenuDishRepository menu;
    private final SeatingZoneRepository zones;
    private final ShelfBookRepository shelf;
    private final StoryChapterRepository story;
    private final ChapterSettingsRepository chapterSettings;

    public KathaaSeeder(WorkflowRepository workflowRepository, WorkflowService workflowService,
                        BranchRepository branchRepository, MenuDishRepository menu, SeatingZoneRepository zones,
                        ShelfBookRepository shelf, StoryChapterRepository story,
                        ChapterSettingsRepository chapterSettings) {
        this.workflowRepository = workflowRepository;
        this.workflowService = workflowService;
        this.branchRepository = branchRepository;
        this.menu = menu;
        this.zones = zones;
        this.shelf = shelf;
        this.story = story;
        this.chapterSettings = chapterSettings;
    }

    @EventListener(ApplicationReadyEvent.class)
    @org.springframework.core.annotation.Order(10)
    @Transactional
    public void seed() {
        seedWorkflows();
        seedBranch();
        seedZones();
        seedMenu();
        seedShelf();
        seedStory();
        if (!chapterSettings.existsById(1L)) {
            chapterSettings.save(ChapterSettings.builder().id(1L).build());
        }
    }

    // ── Workflows ──

    private void seedWorkflows() {
        if (!workflowRepository.existsByCode(KathaaTypes.WF_TABLE)) {
            workflowRepository.save(Workflow.builder().code(KathaaTypes.WF_TABLE).label("Table bookings")
                    .isDefault(false).staffRole("Host").build());
            // Free booking → ₹0 path lands straight on CONFIRMED. Guests can cancel until they're seated.
            List<WorkflowDto.StageDto> stages = new ArrayList<>();
            stages.add(stage("REQUESTED", "Requested", true, false, false, true, RefundPolicy.FULL, null, 10, List.of()));
            stages.add(stage("CONFIRMED", "Table confirmed", false, true, false, true, RefundPolicy.FULL, null, null,
                    emails()));
            stages.add(stage("SEATED", "Seated", false, false, false, false, RefundPolicy.NONE, null, 150, List.of()));
            stages.add(stage(KathaaTypes.STAGE_FINISHED, "Finished — come back soon", false, false, true, false,
                    RefundPolicy.NONE, null, null, List.of()));
            stages.add(stage(WorkflowService.CANCELLED_CODE, "Cancelled", false, false, true, false, RefundPolicy.NONE,
                    null, null, emails()));
            workflowService.replaceWorkflow(KathaaTypes.WF_TABLE, WorkflowDto.builder()
                    .code(KathaaTypes.WF_TABLE).label("Table bookings").staffRole("Host").stages(stages).build());
            log.info("Seeded workflow {}", KathaaTypes.WF_TABLE);
        }
        if (!workflowRepository.existsByCode(KathaaTypes.WF_TAKEAWAY)) {
            workflowRepository.save(Workflow.builder().code(KathaaTypes.WF_TAKEAWAY).label("Counter takeaway")
                    .isDefault(false).staffRole("Barista").build());
            List<WorkflowDto.BindingDto> cancelBindings = new ArrayList<>(emails());
            cancelBindings.add(binding(DemoRefundConnector.ID, DemoRefundConnector.REFUND_ISSUE, 2));
            List<WorkflowDto.StageDto> stages = new ArrayList<>();
            stages.add(stage("PLACED", "Placed", true, false, false, true, RefundPolicy.FULL, null, 10, List.of()));
            stages.add(stage("ACCEPTED", "Accepted", false, true, false, true, RefundPolicy.FULL, null, 5, emails()));
            stages.add(stage("IN_KITCHEN", "In the kitchen", false, false, false, true, RefundPolicy.PARTIAL, 50, 20,
                    List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0))));
            stages.add(stage("READY", "Ready at the counter", false, false, false, false, RefundPolicy.NONE, null, 30,
                    List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0))));
            stages.add(stage(KathaaTypes.STAGE_COLLECTED, "Collected", false, false, true, false, RefundPolicy.NONE,
                    null, null, List.of()));
            stages.add(stage(WorkflowService.CANCELLED_CODE, "Cancelled", false, false, true, false, RefundPolicy.NONE,
                    null, null, cancelBindings));
            workflowService.replaceWorkflow(KathaaTypes.WF_TAKEAWAY, WorkflowDto.builder()
                    .code(KathaaTypes.WF_TAKEAWAY).label("Counter takeaway").staffRole("Barista").stages(stages).build());
            log.info("Seeded workflow {}", KathaaTypes.WF_TAKEAWAY);
        }
    }

    private static List<WorkflowDto.BindingDto> emails() {
        return List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0),
                binding(EmailConnector.ID, EmailConnector.EMAIL_STORE, 1));
    }

    private static WorkflowDto.BindingDto binding(String connector, String action, int ordinal) {
        return WorkflowDto.BindingDto.builder().connectorId(connector).actionCode(action).ordinal(ordinal)
                .enabled(true).build();
    }

    private static WorkflowDto.StageDto stage(String code, String label, boolean initial, boolean onPaid,
                                              boolean terminal, boolean cancellable, RefundPolicy policy,
                                              Integer refundPercent, Integer targetMinutes,
                                              List<WorkflowDto.BindingDto> bindings) {
        return WorkflowDto.StageDto.builder().code(code).label(label).initial(initial).onPaidEntry(onPaid)
                .terminal(terminal).cancellable(cancellable).refundPolicy(policy).refundPercent(refundPercent)
                .targetMinutes(targetMinutes).bindings(bindings).build();
    }

    // ── Branch ──

    private void seedBranch() {
        if (branchRepository.existsBySlug(KathaaTypes.BRANCH_SLUG)) return;
        Instant now = Instant.now();
        branchRepository.save(Branch.builder()
                .name("Cafe Kathaa — FC Road").slug(KathaaTypes.BRANCH_SLUG).phone("+91 91194 96767")
                .addressLine("FC Road Lane, opposite Hotel Vaishali, next to the old British Library building, Ganeshwadi")
                .city("Pune").state("Maharashtra").pincode("411004")
                .latitude(18.520764).longitude(73.8405691)
                .googleMapsUrl("https://www.google.com/maps/place/Cafe+Kathaa/@18.520764,73.8405691,17z")
                .openingHours("Mon–Thu 10 AM–10:30 PM · Fri–Sun 8 AM–10:30 PM")
                .active(true).createdAt(now).updatedAt(now).build());
    }

    // ── Starter content (owner-editable) ──

    private void seedZones() {
        if (zones.count() > 0) return;
        Instant now = Instant.now();
        zones.save(SeatingZone.builder().name("The Library Room").slug("library-room")
                .description("Indoors, under the wall of books. Kindles on the tables, fiction and non-fiction an arm’s length away.")
                .tagline("Books within reach").seatsPerSlot(24).maxParty(6).firstSlot("10:00").lastSlot("21:00")
                .slotMinutes(90).petFriendly(false).workFriendly(false).sortOrder(1).active(true)
                .createdAt(now).updatedAt(now).build());
        zones.save(SeatingZone.builder().name("The Garden Verandah").slug("garden-verandah")
                .description("Outdoor seating in the bungalow’s garden, beside the wall of potted plants. Your dog is welcome too.")
                .tagline("Pets welcome · open air").seatsPerSlot(20).maxParty(6).firstSlot("10:00").lastSlot("21:00")
                .slotMinutes(90).petFriendly(true).workFriendly(false).sortOrder(2).active(true)
                .createdAt(now).updatedAt(now).build());
        zones.save(SeatingZone.builder().name("The Writing Desks").slug("writing-desks")
                .description("Quiet seats for writers and freelancers — Wi-Fi, a plug point and three unhurried hours.")
                .tagline("Wi-Fi · 3-hour desk").seatsPerSlot(8).maxParty(2).firstSlot("10:00").lastSlot("19:00")
                .slotMinutes(180).petFriendly(false).workFriendly(true).sortOrder(3).active(true)
                .createdAt(now).updatedAt(now).build());
    }

    private void seedMenu() {
        if (menu.count() > 0) return;
        // Dish names are taken from published write-ups of the cafe (LBB, Curly Tales, EazyDiner reviews).
        // Prices are starter values for the owner to confirm in /admin/kathaa-menu.
        dish("Katha Signature Sandwich with Fries", "Plates & Sandwiches", "180", Diet.VEG, true, 1,
                "The house sandwich, served with fries.", "The one with our name on it.");
        dish("Signature Egg Sushi", "Plates & Sandwiches", "260", Diet.EGG, true, 2,
                "Kathaa’s own take on sushi, built around egg.", "Not what you expect — that’s the point.");
        dish("Falafel Burger Platter", "Plates & Sandwiches", "320", Diet.VEG, false, 3,
                "Falafel burger served as a full platter.", null);
        dish("Mexican Nachos", "Plates & Sandwiches", "280", Diet.VEG, false, 4,
                "Loaded nachos for the table.", "Regulars call them a must-try.");
        dish("Spicy Fries", "Plates & Sandwiches", "180", Diet.VEG, false, 5,
                "Fries with a kick.", null);
        dish("Risotto", "Pizza & Risotto", "360", Diet.VEG, false, 6,
                "Slow-stirred and creamy.", null);
        dish("Coconut & Pineapple Hawaii Pizza", "Pizza & Risotto", "380", Diet.VEG, true, 7,
                "Coconut and pineapple on a Hawaii-style pizza.", "Sweet, salty, argued about at every table.");
        dish("Apple Crumble Pizza", "Desserts", "320", Diet.VEG, true, 8,
                "A dessert pizza with apple crumble on top.", "Dessert, pretending to be dinner.");
        dish("Sizzling Brownie", "Desserts", "240", Diet.EGG, false, 9,
                "Brownie served on a sizzler plate.", null);
        dish("Pineapple & Ginger Cooler", "Drinks", "180", Diet.VEG, false, 10,
                "Pineapple and ginger, poured cold.", "For the long afternoon chapter.");
    }

    private void dish(String name, String category, String price, Diet diet, boolean signature, int order,
                      String description, String pageNote) {
        Instant now = Instant.now();
        menu.save(MenuDish.builder().name(name).slug(BulkRows.slugify(name)).category(category)
                .price(new BigDecimal(price)).diet(diet).signature(signature).sortOrder(order)
                .description(description).pageNote(pageNote).active(true).workflowCode(KathaaTypes.WF_TAKEAWAY)
                .createdAt(now).updatedAt(now).build());
    }

    private void seedShelf() {
        if (shelf.count() > 0) return;
        // Starter shelf for the demo — the owner replaces it with the real shelf via bulk upload.
        book("Batatyachi Chaal", "P. L. Deshpande", "मराठी", "Humour", true,
                "Pune’s favourite humorist on life in a Mumbai chawl.");
        book("Shyamchi Aai", "Sane Guruji", "मराठी", "Memoir", false, "A son’s stories of his mother.");
        book("Mrityunjay", "Shivaji Sawant", "मराठी", "Mythology", false, "The Mahabharata through Karna’s eyes.");
        book("Godaan", "Munshi Premchand", "हिंदी", "Classic", false, "A farmer, a cow, and a whole village.");
        book("Malgudi Days", "R. K. Narayan", "English", "Short stories", true, "Small-town stories to read one per coffee.");
        book("The God of Small Things", "Arundhati Roy", "English", "Fiction", false, "Twins, a river and a family in Kerala.");
        book("A Suitable Boy", "Vikram Seth", "English", "Fiction", false, "For when you’ve booked the long slot.");
        book("Kafka on the Shore", "Haruki Murakami", "English", "Fiction", false, "Cats, rain and a boy who runs away.");
        book("The Little Prince", "Antoine de Saint-Exupéry", "English", "Fable", true, "Read it again. It’s different now.");
        book("Sapiens", "Yuval Noah Harari", "English", "Non-fiction", false, "A short history of us, for a long brunch.");
    }

    private void book(String title, String author, String language, String genre, boolean pick, String blurb) {
        Instant now = Instant.now();
        shelf.save(ShelfBook.builder().title(title).author(author).language(language).genre(genre)
                .staffPick(pick).blurb(blurb).copies(1).active(true).createdAt(now).updatedAt(now).build());
    }

    private void seedStory() {
        if (story.count() > 0) return;
        chapter("The house", "An old bungalow off FC Road", 1,
                "Before it poured coffee, Kathaa was an old-school bungalow in a lane off Fergusson College Road — "
                        + "opposite Hotel Vaishali, next to the old British Library building. The verandah and the garden "
                        + "stayed. The kitchen moved in.");
        chapter("The shelves", "A wall loaded with books", 2,
                "Kathaa means story, so the books came first: fiction and non-fiction along the walls, and Kindles on "
                        + "the tables for anyone who’d rather scroll than turn pages.");
        chapter("2018", "Found by the city", 3,
                "By 2018 food writers were calling it a famous haunt for college students. Writers and freelancers "
                        + "settled in for the Wi-Fi; friends stayed on for the dessert pizza.");
        chapter("The garden", "Plants, pets and the open air", 4,
                "Outdoor seats, a wall of potted plants and a pet-friendly welcome — so the dog comes along too.");
        chapter("Today", "More than 5,600 reviews later", 5,
                "Weekends are still packed. So now you can save a table, a writing desk or a book from the shelf "
                        + "before you walk in.");
    }

    private void chapter(String marker, String title, int order, String body) {
        Instant now = Instant.now();
        story.save(StoryChapter.builder().marker(marker).title(title).body(body).sortOrder(order).active(true)
                .createdAt(now).updatedAt(now).build());
    }
}
