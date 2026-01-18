import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { userService } from "../services/api";
import "../assets/styles/profile.css";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activePage, setActivePage] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActivePage(tab);
    }
  }, [searchParams]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, userAddresses, userOrders] = await Promise.all([
          userService.getProfile(),
          userService.getAddresses(),
          userService.getOrders()
        ]);
        
        setProfileData(profile);
        setAddresses(userAddresses);
        // Normalize orders data to match backend format
        const normalizedOrders = Array.isArray(userOrders) 
          ? userOrders.map(order => ({
              ...order,
              items: order.items || [],
              createdAt: order.createdAt || new Date().toISOString(),
            }))
          : [];
        setOrders(normalizedOrders);
      } catch (err) {
        console.error("Failed to load profile data", err);
      }
    };

    fetchData();
  }, []);

  const [newAddress, setNewAddress] = useState({
    name: "",
    type: "Home",
    address: "",
    city: "",
    country: "India",
    phone: "",
    isDefault: false
  });

  const [walletBalance, setWalletBalance] = useState(0.00);
  const [walletFilter, setWalletFilter] = useState("all");

  useEffect(() => {
    const scrollBtn = document.getElementById("scrollToTopBtn");

    const onScroll = () => {
      if (scrollBtn) {
        scrollBtn.style.display = window.scrollY > 100 ? "flex" : "none";
      }
    };

    window.addEventListener("scroll", onScroll);
    scrollBtn?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Save profile data to localStorage
    localStorage.setItem('groomupUser', JSON.stringify(profileData));
    setShowEditModal(false);
    alert("Profile updated successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem('groomupUser');
    setShowLogoutModal(false);
    window.location.href = "/login";
  };

  const handleAddAddress = () => {
    if (newAddress.isDefault) {
      // Remove default from all addresses
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: false
      }));
      setAddresses(updatedAddresses);
    }

    const newAddr = {
      ...newAddress,
      id: addresses.length + 1,
      name: newAddress.name || profileData.fullName
    };

    setAddresses([...addresses, newAddr]);
    setShowAddAddressModal(false);
    setNewAddress({
      name: "",
      type: "Home",
      address: "",
      city: "",
      country: "India",
      phone: "",
      isDefault: false
    });
    alert("Address added successfully!");
  };

  const handleRemoveAddress = (id) => {
    if (window.confirm("Are you sure you want to remove this address?")) {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      setAddresses(updatedAddresses);
    }
  };

  const handleSetDefaultAddress = (id) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setAddresses(updatedAddresses);
  };

  const handleWalletAction = (action) => {
    if (action === "add") {
      const amount = prompt("Enter amount to add (₹):");
      if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        setWalletBalance(prev => prev + parseFloat(amount));
        alert(`₹${amount} added to your wallet!`);
      }
    } else if (action === "withdraw") {
      if (walletBalance <= 0) {
        alert("Insufficient balance in wallet!");
        return;
      }
      const amount = prompt("Enter amount to withdraw (₹):");
      if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        if (parseFloat(amount) > walletBalance) {
          alert("Insufficient balance!");
        } else {
          setWalletBalance(prev => prev - parseFloat(amount));
          alert(`₹${amount} withdrawn from your wallet!`);
        }
      }
    }
  };

  const renderProfileContent = () => {
    switch (activePage) {
      case "profile":
        return (
          <div className="profile-content">
            <div className="profile-header">
              <div>
                <h1>My Profile</h1>
                <p>
                  You can edit/update your profile information by clicking on edit
                  profile button.
                </p>
              </div>

              <button
                className="edit-profile-btn"
                onClick={() => setShowEditModal(true)}
              >
                Edit Profile
              </button>
            </div>

            <div className="profile-info-grid">
              <div className="info-card">
                <h3>FULL NAME</h3>
                <p>{profileData.fullName}</p>
              </div>

              <div className="info-card">
                <h3>EMAIL</h3>
                <p>{profileData.email}</p>
              </div>

              <div className="info-card">
                <h3>PHONE NUMBER</h3>
                <p>{profileData.phone}</p>
              </div>

              <div className="info-card">
                <h3>DATE OF BIRTH</h3>
                <p>{profileData.dob || "Not set"}</p>
              </div>

              <div className="info-card">
                <h3>GENDER</h3>
                <p>{profileData.gender}</p>
              </div>
            </div>

            <div className="offers-section">
              <h2>Get Coupons & Offers</h2>
              <p>We make great emails (and even better offers). If you ever find 'em boring, you can unsubscribe anytime.</p>
              <button className="subscribe-btn">Subscribe Now</button>
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="profile-content orders-section">
            <div className="orders-header">
              <div>
                <h1>My Orders</h1>
                <p>View and manage your order history</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="no-orders">
                <i className="fas fa-box-open"></i>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet. Start shopping!</p>
              </div>
            ) : (
              orders.map(order => {
                const formatDate = (dateString) => {
                  if (!dateString) return 'N/A';
                  try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  } catch {
                    return dateString;
                  }
                };

                const itemCount = order.items ? order.items.length : 0;
                const totalPrice = order.totalPrice || 0;

                return (
                  <div className="order-card" key={order.id}>
                    <div className="order-header">
                      <div className="order-id">Order #{order.id}</div>
                      <div className="order-date">Date: {formatDate(order.createdAt)}</div>
                    </div>
                    <div className="order-details">
                      <div>
                        <div className="order-total">Total: Rs. {Number(totalPrice).toFixed(2)}</div>
                        <div className="order-items">Items: {itemCount}</div>
                        <div className="order-status">Status: {order.status || 'PENDING'}</div>
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={() => window.location.href = '/orders'}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case "addresses":
        return (
          <div className="profile-content addresses-section">
            <div className="addresses-header">
              <div>
                <h1>Addresses</h1>
                <p>Manage your delivery addresses</p>
              </div>
            </div>

            {addresses.length === 0 ? (
              <div className="no-addresses">
                <i className="fas fa-map-marker-alt"></i>
                <h3>No Addresses Added</h3>
                <p>Add your first delivery address to get started.</p>
              </div>
            ) : (
              addresses.map(address => (
                <div className={`address-card ${address.isDefault ? 'address-default' : ''}`} key={address.id}>
                  <div className="address-header">
                    <div className="address-name">{address.name}</div>
                    <div className="address-type">{address.type}</div>
                  </div>
                  <div className="address-details">
                    <p>{address.address}</p>
                    <p>{address.city}</p>
                    <p>{address.country}</p>
                    <p>Phone: {address.phone}</p>
                    {address.isDefault && <p className="default-badge">Default Address</p>}
                  </div>
                  <div className="address-actions">
                    <button className="address-action">Edit</button>
                    <button className="address-action" onClick={() => handleRemoveAddress(address.id)}>Remove</button>
                    {!address.isDefault && (
                      <button className="address-action" onClick={() => handleSetDefaultAddress(address.id)}>Set as Default</button>
                    )}
                  </div>
                </div>
              ))
            )}

            <button className="add-address-btn" onClick={() => setShowAddAddressModal(true)}>
              <i className="fas fa-plus"></i> Add New Address
            </button>
          </div>
        );

      case "wallet":
        return (
          <div className="profile-content wallet-section">
            <div className="wallet-header">
              <div>
                <h1>GroomUp Wallet</h1>
                <p>Manage your wallet balance and transactions</p>
              </div>
            </div>

            <div className="wallet-balance-card">
              <h2>YOUR CURRENT BALANCE</h2>
              <div className="wallet-balance">₹{walletBalance.toFixed(2)}</div>
              <div className="wallet-actions">
                <button className="wallet-btn" onClick={() => handleWalletAction("add")}>Add Money</button>
                <button className="wallet-btn" onClick={() => handleWalletAction("withdraw")}>Withdraw</button>
              </div>
            </div>

            <div className="transactions-section">
              <div className="transactions-header">
                <h2>Transactions</h2>
                <div className="transaction-filter">
                  <button 
                    className={`filter-btn ${walletFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setWalletFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-btn ${walletFilter === 'credit' ? 'active' : ''}`}
                    onClick={() => setWalletFilter('credit')}
                  >
                    Credit
                  </button>
                  <button 
                    className={`filter-btn ${walletFilter === 'debit' ? 'active' : ''}`}
                    onClick={() => setWalletFilter('debit')}
                  >
                    Debit
                  </button>
                </div>
              </div>
              
              <div className="no-transactions">
                <i className="fas fa-receipt"></i>
                <h3>There is no activity to show yet!</h3>
                <p>Your transaction history will appear here once you start using your wallet.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      {/* HEADER */}
      

      {/* HERO */}
      <section className="profile-hero">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </section>

      {/* CONTENT */}
      <section className="profile-container">
        <aside className="profile-sidebar">
          <h2>Profile</h2>

          <ul className="sidebar-menu">
            <li>
              <a 
                className={activePage === "profile" ? "active" : ""}
                onClick={() => setActivePage("profile")}
              >
                <i className="fas fa-user"></i> My Profile
              </a>
            </li>
            <li>
              <a 
                className={activePage === "orders" ? "active" : ""}
                onClick={() => setActivePage("orders")}
              >
                <i className="fas fa-box"></i> My Orders
              </a>
            </li>
            <li>
              <a 
                className={activePage === "addresses" ? "active" : ""}
                onClick={() => setActivePage("addresses")}
              >
                <i className="fas fa-map-marker-alt"></i> Addresses
              </a>
            </li>
            <li>
              <a 
                className={activePage === "wallet" ? "active" : ""}
                onClick={() => setActivePage("wallet")}
              >
                <i className="fas fa-wallet"></i> GroomUp Wallet
              </a>
            </li>
          </ul>

          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <i className="fas fa-sign-out-alt"></i> LOG OUT
          </button>
        </aside>

        {renderProfileContent()}
      </section>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <span onClick={() => setShowEditModal(false)}>×</span>
            </div>

            <div className="modal-body">
              <label>Full Name</label>
              <input
                name="fullName"
                value={profileData.fullName}
                onChange={handleChange}
              />

              <label>Email Address</label>
              <input
                name="email"
                value={profileData.email}
                onChange={handleChange}
              />

              <label>Phone Number</label>
              <input
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
              />

              <div className="modal-row">
                <div>
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={profileData.dob}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button className="modal-save" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {showAddAddressModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="modal-header">
              <h2>Add New Address</h2>
              <span onClick={() => setShowAddAddressModal(false)}>×</span>
            </div>

            <div className="modal-body">
              <label>Full Name</label>
              <input
                name="name"
                value={newAddress.name}
                onChange={handleAddressChange}
                placeholder="Enter your name"
              />

              <label>Address Type</label>
              <select
                name="type"
                value={newAddress.type}
                onChange={handleAddressChange}
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>

              <label>Address</label>
              <input
                name="address"
                value={newAddress.address}
                onChange={handleAddressChange}
                placeholder="Enter your address"
              />

              <label>City & Postal Code</label>
              <input
                name="city"
                value={newAddress.city}
                onChange={handleAddressChange}
                placeholder="City, State, Postal Code"
              />

              <label>Country</label>
              <input
                name="country"
                value={newAddress.country}
                onChange={handleAddressChange}
                placeholder="Country"
              />

              <label>Phone Number</label>
              <input
                name="phone"
                value={newAddress.phone}
                onChange={handleAddressChange}
                placeholder="Enter phone number"
              />

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="defaultAddress"
                  name="isDefault"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                />
                <label htmlFor="defaultAddress">Set as default address</label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowAddAddressModal(false)}
              >
                Cancel
              </button>
              <button className="modal-save" onClick={handleAddAddress}>
                Add Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="profile-modal-overlay">
          <div className="logout-modal">
            <div className="logout-icon">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <h2>Are you sure you want to logout?</h2>
            <p>You will need to log in again to access your account.</p>
            <div className="logout-actions">
              <button className="logout-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="logout-confirm" onClick={handleLogout}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <button id="scrollToTopBtn">↑</button>
    </div>
  );
};

export default Profile;
