import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input, SuffixButton } from '@/components/ui/Input.jsx';

/** Password field with a show/hide toggle. Accepts every <Input> prop. */
const PasswordInput = forwardRef(function PasswordInput({ icon = Lock, ...rest }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      icon={icon}
      suffix={
        <SuffixButton
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </SuffixButton>
      }
      {...rest}
    />
  );
});

export default PasswordInput;
