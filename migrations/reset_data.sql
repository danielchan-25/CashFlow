DELETE FROM transactions;
DELETE FROM categories;
DELETE FROM accounts;
DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'categories', 'accounts');

