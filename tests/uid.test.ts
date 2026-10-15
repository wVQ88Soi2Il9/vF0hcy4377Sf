import { describe, it, expect } from 'vitest';
import * as core from '../src/core';

describe('generate_uid', () =>
{
    it('產生 16 位 hex 字串', () =>
    {
        expect(core.generate_uid()).toMatch(/^[0-9a-f]{16}$/);
    });

    it('create_tree 的根節點使用 root_history_uid', () =>
    {
        const tree = core.create_tree();
        expect(tree.current_history_uid).toBe(tree.root_history_uid);
        expect(tree.nodes.get(tree.root_history_uid)!.parent_history_uid).toBeNull();
    });
});
