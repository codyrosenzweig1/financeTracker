from flask import Blueprint, request, jsonify
from models import db, Transaction
from sqlalchemy import asc, desc, func
from datetime import datetime

transaction_routes = Blueprint('transaction_routes', __name__)

@transaction_routes.route('/add_transaction', methods=['POST'])
def add_transaction():
    data = request.json
    new_transaction = Transaction(
        amount = data['amount'],
        category=data['category'],
        description=data['description']
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify({"message": "Transaction added!"}), 201

@transaction_routes.route('/get_transactions', methods=['GET'])
def get_transactions():
    sort_option = request.args.get('sort', 'date')
    category_filter = request.args.get('category', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    query = Transaction.query
    
    if category_filter:
        query = query.filter(Transaction.category.ilike(f"%{category_filter}%"))
        
    if start_date:
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.date >= start_date)
        except:
            return jsonify({"error:" "Invalid start_date format"}), 400

    if end_date:
        try:
            end_date = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(Transaction.date <= end_date)
        except:
            return jsonify({"error:", "Invalid end_date format"}), 400
        
    if sort_option == 'amount':
        query = query.order_by(asc(Transaction.amount))
    else:
        query = query.order_by(desc(Transaction.date))
    
    transactions = query.all()
    
    return jsonify([{
        'id': transaction.id,
        'amount': transaction.amount,
        'category': transaction.category,
        'date': transaction.date.strftime("%Y-%m-%d"),
        'description': transaction.description
    } for transaction in transactions]), 200
    
@transaction_routes.route('/edit_transaction/<int:id>', methods=['PUT'])
def edit_transaction(id):
    data = request.json
    transaction = Transaction.query.get(id)
    
    if transaction:
        transaction.amount = data.get('amount', transaction.amount)
        transaction.category = data.get('category', transaction.category)
        transaction.description = data.get('description', transaction.description)
        db.session.commit()
        return jsonify({"message": "Transaction updated!"}), 200
    else:
        return jsonify({"error": "Transaction not found"}), 404
    
@transaction_routes.route('/delete_transaction/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get(id)
    
    if transaction:
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({"message": "Transaction deleted!"}), 200
    else:
        return jsonify({"error": "Transaction not found"}), 404
    
@transaction_routes.route('/get_summary', methods=['GET'])
def get_summary():
    total_spending = db.session.query(func.sum(Transaction.amount)).scalar() or 0.0
    
    category_totals = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount)
    ).group_by(Transaction.category).all()
    
    category_totals_dict = {category: total for category, total in category_totals}
    
    return jsonify({
        "total_spending": total_spending,
        "category_totals": category_totals_dict
    })

@transaction_routes.route('/get_spending_over_time', methods=["GET"])
def get_spending_over_time():
    results = db.session.query(
        func.date(Transaction.date).label('date'),
        func.sum(Transaction.amount).label('totalSpending')
    ).group_by(func.date(Transaction.date)).order_by(func.date(Transaction.date)).all()
    
    time_series_data = [
        {"date": result.date.strftime("%Y-%m-%d"), 
         "totalSpending": result.totalSpending
         } for result in results 
    ]
    
    return jsonify(time_series_data)