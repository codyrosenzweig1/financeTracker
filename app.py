from flask import Flask, render_template
from models import db, User, Transaction
from routes.user_routes import user_routes
from routes.transaction_routes import transaction_routes
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://finance_user:{os.getenv('DATABASE_PASSWORD')}@localhost/finance_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def home():
    return render_template('index.html')

app.register_blueprint(user_routes)
app.register_blueprint(transaction_routes)

with app.app_context():
    db.create_all()
    
if __name__ == '__main__':
    app.run(debug=True)