"""SQLite persistence only. Domain decisions belong to services.

Single local demo identity; no user IDs accepted from clients.
"""
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path


class Repository:
    TABLES = {"garments", "recommendations", "history", "feedback"}

    def __init__(self, database: str):
        self.database = database
        Path(database).parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as conn:
            for table in sorted(self.TABLES):
                conn.execute(f"CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, body TEXT NOT NULL)")

    @contextmanager
    def connection(self):
        with sqlite3.connect(self.database, timeout=10) as conn:
            yield conn

    def _table(self, table):
        if table not in self.TABLES:
            raise ValueError("Unknown table")
        return table

    def list(self, table):
        with self.connection() as conn:
            return [json.loads(row[0]) for row in conn.execute(
                f"SELECT body FROM {self._table(table)} ORDER BY rowid DESC")]

    def get(self, table, key):
        with self.connection() as conn:
            row = conn.execute(f"SELECT body FROM {self._table(table)} WHERE id=?", (key,)).fetchone()
            return json.loads(row[0]) if row else None

    def save(self, table, model):
        with self.connection() as conn:
            conn.execute(f"INSERT INTO {self._table(table)} (id, body) VALUES (?, ?) "
                         "ON CONFLICT(id) DO UPDATE SET body=excluded.body",
                         (model.id, model.model_dump_json()))
        return model

    def delete(self, table, key):
        with self.connection() as conn:
            return conn.execute(f"DELETE FROM {self._table(table)} WHERE id=?", (key,)).rowcount > 0
