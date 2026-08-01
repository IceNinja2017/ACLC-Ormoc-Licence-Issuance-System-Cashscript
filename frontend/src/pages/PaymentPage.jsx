import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PaymentPage() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [txId, setTxId] = useState("");

useEffect(() => {

async function fetchPayment(){

try {

const response = await axios.get(
  `/api/application/${id}`
);


setPayment(
  response.data.data.payment
);


}
catch(error){

console.error(error);

}
finally{

setLoading(false);

}

}


fetchPayment();

}, [id]);

if (loading) {
return (
  <div className="text-white">
    Loading payment...
  </div>
);
}


    const bchAddress = payment.address;

    const amount = payment.amount;
    const paymentURI =
        `${bchAddress}?amount=${amount}`;

async function submitTransaction(){

try {

await axios.put(
 `/api/application/${id}/payment`,
 {
   transactionId: txId
 }
);


alert("Payment submitted for verification");


}
catch(error){

console.error(error);

alert(
 error.response?.data?.message ||
 "Payment verification failed"
);

}

}

  return (

    <main className="min-h-screen bg-slate-950 px-6 py-12">

      <div
        className="
          mx-auto
          max-w-xl
          rounded-2xl
          border
          border-white/10
          bg-white/5
          p-8
          shadow-2xl
        "
      >

        {/* Header */}

        <div className="mb-8">

          <p
            className="
              text-xs
              uppercase
              tracking-[0.2em]
              text-slate-400
            "
          >
            PAYMENT
          </p>


          <h1
            className="
              mt-2
              text-3xl
              font-bold
              text-white
            "
          >
            Complete Payment
          </h1>


          <p
            className="
              mt-2
              text-slate-400
            "
          >
            Scan the QR code using your Bitcoin Cash wallet.
          </p>

        </div>



        {/* QR */}

        <div
          className="
            flex
            justify-center
            rounded-xl
            bg-white
            p-6
          "
        >

          <QRCode
            value={paymentURI}
            size={220}
          />

        </div>



        {/* Amount */}

        <div
          className="
            mt-6
            rounded-xl
            bg-white/5
            p-5
          "
        >

          <p className="text-sm text-slate-400">
            Amount Due
          </p>


          <p
            className="
              mt-1
              text-2xl
              font-bold
              text-white
            "
          >
            {amount} BCH
          </p>

        </div>



        {/* Address */}

        <div className="mt-5">

          <p className="text-sm text-slate-400">
            Payment Address
          </p>


          <div
            className="
              mt-2
              break-all
              rounded-lg
              bg-black/30
              p-3
              text-sm
              text-white
            "
          >
            {bchAddress}
          </div>

        </div>



        {/* Transaction ID */}

        <div className="mt-6">

          <label
            className="
              text-sm
              text-slate-400
            "
          >
            Transaction ID
          </label>


<input
value={txId}
onChange={(e)=>setTxId(e.target.value)}
className="
mt-2
w-full
rounded-lg
border
border-white/10
bg-black/20
px-4
py-3
text-white
outline-none
focus:border-green-400
"
placeholder="Paste your BCH transaction ID"
/>

        </div>


<button
onClick={submitTransaction}
className="
mt-6
w-full
rounded-lg
bg-green-500
py-3
font-semibold
text-black
transition
hover:bg-green-400
"
>
Submit Transaction
</button>



        <button
          onClick={() => navigate("/applications")}
          className="
            mt-3
            w-full
            rounded-lg
            border
            border-white/10
            py-3
            text-white
            hover:bg-white/5
          "
        >
          Back to Applications
        </button>


      </div>

    </main>

  );
}