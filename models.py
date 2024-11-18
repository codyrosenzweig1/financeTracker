from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(80), unique = True, nullable=False)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(80), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.String(200))
    
    def __repr__(self):
        return f'<Transaction {self.amount} - {self.category}>'