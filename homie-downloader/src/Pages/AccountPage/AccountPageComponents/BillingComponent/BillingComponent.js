import React from "react";

const payments = [
  { id: 1, date: "2023-01-15", amount: 9.99, method: "Visa ****4242", status: "Completed" },
  { id: 2, date: "2023-02-15", amount: 9.99, method: "Visa ****4242", status: "Completed" },
  { id: 3, date: "2023-03-15", amount: 9.99, method: "Mastercard ****5555", status: "Completed" },
];

const BillingComponent = () => {
  return (
    <>
      <div className="details-header">
        <h2>Billing & Payments</h2>
        <p className="section-description">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="details-content billing-content">
        <div className="detail-item full-width">
          <div className="detail-item-header">
            <h4>Subscription Plan</h4>
          </div>
          <div className="plan-info">
            <p className="detail-value">Premium Monthly ($9.99/month)</p>
            <button className="change-plan-btn">
              Change Plan
            </button>
          </div>
        </div>

        <div className="detail-item">
          <div className="detail-item-header">
            <h4>Next Billing Date</h4>
          </div>
          <p className="detail-value">June 15, 2023</p>
        </div>

        <div className="detail-item">
          <div className="detail-item-header">
            <h4>Payment Method</h4>
          </div>
          <p className="detail-value">Visa ****4242</p>
        </div>
      </div>

      <div className="stats-container">
        <div className="stats-section">
          <h3 className="stats-title">Payment History</h3>

          <div className="payment-history">
            {payments.map(payment => (
              <div key={payment.id} className="payment-item">
                <div className="payment-header">
                  <h4>{new Date(payment.date).toLocaleDateString()}</h4>
                  <span className="payment-status">{payment.status}</span>
                </div>
                <div className="payment-details">
                  <p className="detail-value">{payment.method}</p>
                  <p className="detail-value">${payment.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingComponent;