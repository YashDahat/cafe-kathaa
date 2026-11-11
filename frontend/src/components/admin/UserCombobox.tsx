// Shim for a foundation component that CodesPage imports but the foundation repo does not ship
// (reported as a suspected foundation bug). Minimal, admin-only: pick a user by name/email.
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NONE = '__none__';

export function UserCombobox({ id, value, onChange }: {
  id?: string; value: number | null; onChange: (userId: number | null) => void;
}) {
  const { data: users = [] } = useQuery({ queryKey: ['admin', 'users'], queryFn: userService.list });
  return (
    <Select value={value == null ? NONE : String(value)} onValueChange={(v) => onChange(v === NONE ? null : Number(v))}>
      <SelectTrigger id={id}><SelectValue placeholder="Choose a customer" /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No specific customer</SelectItem>
        {users.map((u) => (
          <SelectItem key={u.id} value={String(u.id)}>
            {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email} · {u.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default UserCombobox;
