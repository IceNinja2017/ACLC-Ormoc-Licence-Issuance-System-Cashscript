import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    paid: 0,
    minted: 0,
    });

    useEffect(() => {
  async function fetchStats() {
    try {
        
      const response = await axios.get(
        "/api/application"
      );

      const applications = response.data.data;

setStats({
  pending: applications.filter(
    (a) => a.status === "PENDING"
  ).length,

  approved: applications.filter(
    (a) =>
      a.status === "APPROVED" &&
      a.paymentStatus !== "PAID"
  ).length,

  paid: applications.filter(
    (a) =>
      a.paymentStatus === "PAID" &&
      (!a.nft?.tokenId ||
       !a.nft?.transactionId)
  ).length,

  minted: applications.filter(
    (a) =>
      a.nft?.tokenId &&
      a.nft?.transactionId
  ).length,
});
    } catch (err) {
      console.error(err);
    }
  }

  fetchStats();
}, []);


  return (
    <>
      {/* Hero */}
      <header id="top" className="hero">
        <div>
          <p className="eyebrow">
            ADMIN CONTROL PANEL
          </p>

          <h1>
            Manage the <em>ProofPass</em> ecosystem.
          </h1>

          <p className="lede">
            Review applications, verify payments, mint
            blockchain licenses, and manage the entire
            ProofPass credential lifecycle.
          </p>

          <div className="hero-actions">
            <button
              className="primary"
              onClick={() =>
                navigate("/admin/applications")
              }
            >
              Review Applications →
            </button>
          </div>
        </div>

        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="nft-core">
            ⚙
            <small>
              ADMIN
              <br />
              PORTAL
            </small>
          </div>

          <span className="float-chip chip-a">
            BCH
          </span>

          <span className="float-chip chip-b">
            NFT
          </span>
        </div>
      </header>

      {/* Statistics */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              SYSTEM OVERVIEW
            </p>

            <h2>
              Dashboard Statistics
            </h2>
          </div>

          <span className="icon-orb mint">
            ⚙
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Pending Applications
            </p>

            <h2 className="mt-3 text-4xl font-bold text-white">
              {stats.pending}
            </h2>

            <p className="mt-2 text-sm text-yellow-300">
              Awaiting review
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Approved
            </p>

            <h2 className="mt-3 text-4xl font-bold text-white">
              {stats.approved}
            </h2>

            <p className="mt-2 text-sm text-green-300">
              Ready for payment
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Payments Verified
            </p>

            <h2 className="mt-3 text-4xl font-bold text-white">
              {stats.paid}
            </h2>

            <p className="mt-2 text-sm text-cyan-300">
              Ready for minting
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              NFTs Minted
            </p>

            <h2 className="mt-3 text-4xl font-bold text-white">
              {stats.minted}
            </h2>

            <p className="mt-2 text-sm text-purple-300">
              Stored on BCH
            </p>
          </div>

        </div>
      </section>

      {/* Quick Actions */}
      <section className="panel mt-10">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              ADMIN TOOLS
            </p>

            <h2>
              Quick Actions
            </h2>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          <button
            onClick={() =>
              navigate("/admin/applications?status=PENDING")
            }
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-8
              text-left
              transition
              hover:border-green-400
              hover:bg-white/10
            "
          >
            <h3 className="text-xl font-semibold text-white">
              Review Applications
            </h3>

            <p className="mt-2 text-slate-400">
              Approve or reject submitted
              applications.
            </p>
          </button>

          <button
          onClick={() =>
              navigate("/admin/applications?status=APPROVED")
            }
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-8
              text-left
              transition
              hover:border-blue-400
              hover:bg-white/10
            "
          >
            <h3 className="text-xl font-semibold text-white">
              Verify Payments
            </h3>

            <p className="mt-2 text-slate-400">
              Review BCH transactions before
              issuing licenses.
            </p>
          </button>

          <button
          onClick={() =>
                navigate("/admin/applications?status=PAID")
            }
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-8
              text-left
              transition
              hover:border-purple-400
              hover:bg-white/10
            "
          >
            <h3 className="text-xl font-semibold text-white">
              Mint NFT Licenses
            </h3>

            <p className="mt-2 text-slate-400">
              Sign and mint license NFTs using
              the connected BCH wallet.
            </p>
          </button>

        </div>
      </section>

      {/* Activity */}
      {/* <section className="panel mt-10">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              RECENT ACTIVITY
            </p>

            <h2>
              Latest Events
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="border-b border-white/10 py-4">
            <p className="font-medium text-white">
              No recent activity.
            </p>

            <p className="text-sm text-slate-400">
              Applications, payments, and NFT
              minting events will appear here.
            </p>
          </div>

        </div>
      </section> */}
    </>
  );
}