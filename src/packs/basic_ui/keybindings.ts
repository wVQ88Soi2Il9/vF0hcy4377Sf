import { undo, redo } from '@/API';

/**
 * Initializes global keyboard listeners for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Y / Ctrl+Shift+Z).
 * Automatically ignores shortcuts when an input or textarea element is focused.
 */
export function init_keybindings(): () => void
{
    function handle_keydown(e: KeyboardEvent): void
    {
        // Don't intercept if user is typing in an input, textarea, or contentEditable element
        const target = e.target as HTMLElement | null;
        if (target)
        {
            const tag = target.tagName ? target.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || target.isContentEditable)
            {
                return;
            }
        }

        const is_ctrl_or_cmd = e.ctrlKey || e.metaKey;
        if (!is_ctrl_or_cmd)
        {
            return;
        }

        const key = e.key.toLowerCase();

        // Ctrl+Z or Cmd+Z
        if (key === 'z')
        {
            if (e.shiftKey)
            {
                // Ctrl+Shift+Z -> Redo
                e.preventDefault();
                redo();
            }
            else
            {
                // Ctrl+Z -> Undo
                e.preventDefault();
                undo();
            }
        }
        // Ctrl+Y or Cmd+Y -> Redo
        else if (key === 'y')
        {
            e.preventDefault();
            redo();
        }
    }

    window.addEventListener('keydown', handle_keydown);

    return () =>
    {
        window.removeEventListener('keydown', handle_keydown);
    };
}
