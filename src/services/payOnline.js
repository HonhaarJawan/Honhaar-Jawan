import React, { useEffect, useRef } from "react";

const PayFastPaymentForm = ({ paymentData }) => {
  const formRef = useRef(null);

  useEffect(() => {
    // Ensure paymentData exists before attempting to submit the form
    if (paymentData && formRef.current) {
      formRef.current.submit();
    }
  }, [paymentData]); // Only re-run effect when paymentData changes

  // Render the form, but it will be hidden until paymentData is available
  if (!paymentData) {
    return null; // Don't render anything if paymentData is not available
  }
 
  return (
    <form
      ref={formRef}
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
        value={paymentData?.currency_code}
        readOnly
      />
      <input
        type="text"
        name="MERCHANT_ID"
        value={paymentData?.merchant_id}
        readOnly
      />
      <input type="text" name="TOKEN" value={paymentData?.token} readOnly />
      <input
        type="text"
        name="SUCCESS_URL"
        value={paymentData?.success_url}
        readOnly
      />
      <input
        type="text"
        name="FAILURE_URL"
        value={paymentData?.failed_url}
        readOnly
      />
      <input
        type="text"
        name="CHECKOUT_URL"
        value={paymentData?.checkout_url}
        readOnly
      />
      <input
        type="text"
        name="CUSTOMER_EMAIL_ADDRESS"
        value={paymentData?.email}
        readOnly
      />
      <input
        type="text"
        name="CUSTOMER_MOBILE_NO"
        value={paymentData?.phone}
        readOnly
      />
      <input
        type="text"
        name="TXNAMT"
        value={paymentData?.trans_amount}
        readOnly
      />
      <input
        type="text"
        name="BASKET_ID"
        value={paymentData?.basket_id}
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
  );
};

export default PayFastPaymentForm;
