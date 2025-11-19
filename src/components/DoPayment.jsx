import React, { useEffect } from "react";

const DoPayment = ({ onlinePaymentData }) => {
  onlinePaymentData
  useEffect(() => {
    if (onlinePaymentData) {
      const form = document.getElementById("PayFast_payment_form");
      if (form) {
        // Populate form fields with payment data
        Object.keys(onlinePaymentData).forEach((key) => {
          const input = form.querySelector(`input[name="${key}"]`);
          if (input) {
            input.value = onlinePaymentData[key];
          }
        });

        // Submit the form
        form.submit();
      }
    }
  }, [onlinePaymentData]);
  return (
    <div>
      <form
        id="PayFast_payment_form"
        name="PayFast-payment-form"
        method="POST"
        className="flex flex-col gap-2"
        action="https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction"
        style={{ display: "none" }}
      >
        <input
          type="text"
          name="CURRENCY_CODE"
          value={onlinePaymentData?.currency_code}
          readOnly
        />
        <input
          type="text"
          name="MERCHANT_ID"
          value={onlinePaymentData?.merchant_id}
          readOnly
        />
        <input
          type="text"
          name="TOKEN"
          value={onlinePaymentData?.token}
          readOnly
        />
        <input
          type="text"
          name="SUCCESS_URL"
          value={onlinePaymentData?.success_url}
          readOnly
        />
        <input
          type="text"
          name="FAILURE_URL"
          value={onlinePaymentData?.failed_url}
          readOnly
        />
        <input
          type="text"
          name="CHECKOUT_URL"
          value={onlinePaymentData?.checkout_url}
          readOnly
        />
        <input
          type="text"
          name="CUSTOMER_EMAIL_ADDRESS"
          value={onlinePaymentData?.email}
          readOnly
        />
        <input
          type="text"
          name="CUSTOMER_MOBILE_NO"
          value={onlinePaymentData?.phone}
          readOnly
        />
        <input
          type="text"
          name="TXNAMT"
          value={onlinePaymentData?.trans_amount}
          readOnly
        />
        <input
          type="text"
          name="BASKET_ID"
          value={onlinePaymentData?.basket_id}
          readOnly
        />
        <input
          type="text"
          name="ORDER_DATE"
          value={new Date().toISOString()}
          readOnly
        />
        <input
          type="text"
          name="SIGNATURE"
          value={"SOME-RANDOM-STRING"}
          readOnly
        />
        <input type="text" name="VERSION" value="MERCHANT-CART-0.1" readOnly />
        <input
          type="text"
          name="TXNDESC"
          value="Item Purchased from Cart"
          readOnly
        />
        <input type="text" name="PROCCODE" value="00" readOnly />
        <input type="text" name="TRAN_TYPE" value="ECOMM_PURCHASE" readOnly />
        <input type="text" name="STORE_ID" value={""} readOnly />
        <input type="text" name="RECURRING_TXN" value={"false"} readOnly />
      </form>
    </div>
  );
};

export default DoPayment;
