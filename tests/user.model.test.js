jest.mock('../db', () => ({ query: jest.fn() }));

const pool = require('../db');
const User = require('../src/models/user.model');

describe('User model', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('create returns inserted row', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'A' }] });
        const r = await User.create('A', 'a@b.com', '123', 'pwd');
        expect(pool.query).toHaveBeenCalled();
        expect(r).toEqual({ id: 1, name: 'A' });
    });

    it('getAll returns rows', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
        const r = await User.getAll();
        expect(pool.query).toHaveBeenCalled();
        expect(r).toEqual([{ id: 1 }]);
    });

    it('getById returns row', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 2 }] });
        const r = await User.getById(2);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [2]);
        expect(r).toEqual({ id: 2 });
    });

    it('getByEmail returns row', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 3 }] });
        const r = await User.getByEmail('c@d.com');
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['c@d.com']);
        expect(r).toEqual({ id: 3 });
    });

    it('update with password', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'A', email: 'a@b.com', mobile: '123', password: 'hashedpwd' }] });
        const r = await User.update(1, 'A', 'a@b.com', '123', true, 'hashedpwd');
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['A', 'a@b.com', '123', true, 'hashedpwd', 1]);
        expect(r).toEqual({ id: 1, name: 'A', email: 'a@b.com', mobile: '123', password: 'hashedpwd' });
    });

    it('update without password', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'A', email: 'a@b.com', mobile: '123', password: null }] });
        const r = await User.update(1, 'A', 'a@b.com', '123', true, undefined);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['A', 'a@b.com', '123', true, 1]);
        expect(r).toEqual({ id: 1, name: 'A', email: 'a@b.com', mobile: '123', password: null });
    });

    it('delete sets is_active false and is_deleted true', async () => {
        pool.query.mockResolvedValue({ rows: [{ id: 1, is_active: false, is_deleted: true }] });
        const r = await User.delete(1);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(r).toEqual({ id: 1, is_active: false, is_deleted: true });
    });
});
