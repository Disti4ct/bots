import sqlite3

class SQLight:
    def __init__(self, database):
        self.connection = sqlite3.connect(database)
        self.cursor = self.connection.cursor()

    def user_exists(self, user_id):
        with self.connection:
            result = self.cursor.execute("SELECT * FROM `users` WHERE `user_id` = ?", (user_id,)).fetchall()
            return bool(len(result))

    def add_user(self, user_id, karma = 0):
        with self.connection:
            return self.cursor.execute("INSERT INTO `users` (`user_id`, `karma`) VALUES(?,?)", (user_id, karma))

    def delete_user(self, user_id):
        with self.connection:
            return self.cursor.execute("DELETE FROM `users` WHERE `user_id` = ?", (user_id,))

    def increase_user_karma(self, user_id):
        karma = self.get_user_karma(user_id)
        with self.connection:
            return self.cursor.execute()

    def decrease_user_karma(self, user_id):
        karma = self.get_user_karma(user_id)
        with self.connection:
            return self.cursor.execute()

    def set_user_karma(self, user_id, karma):
        with self.connection:
            return self.cursor.execute()

    def get_user_karma(self, user_id):
        with self.connection:
            karma = self.cursor.execute()
            return int(karma)

    def close(self):
        self.connection.close()