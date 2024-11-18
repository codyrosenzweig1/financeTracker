from flask import Flask, render_template
from models import db, User, Transaction
from routes.user_routes import user_routes
from routes.transaction_routes import transaction_routes

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://finance_user:Rose0402%40%40@localhost/finance_db'
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