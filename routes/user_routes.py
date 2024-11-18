from flask import Blueprint
from models import db, User

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/add_user')
def add_user():
    new_user = User(username="testuser")
    db.session.add(new_user)
    db.session.commit()
    return "User added!"

@user_routes.route('/get_users')
def get_users():
    users = User.query.all()
    return ', '.join([user.username for user in users])