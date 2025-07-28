import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShippingFast, FaMapMarkerAlt, FaHistory, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from '../components/Header';
import headerBg from '../assets/img/header.jpg';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 home-bg">
      <Header />
      <style>{`
        .home-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, rgba(245,247,250,0.7) 0%, rgba(195,207,226,0.7) 100%), url(${headerBg});
          background-size: cover;
          background-position: center;
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .home-sidebar {
          background: #fff;
          border-radius: 18px;
          min-height: 500px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          padding: 2rem 1.5rem;
          transition: box-shadow 0.3s;
        }
        .home-sidebar .list-group-item {
          font-size: 1.1rem;
          font-weight: 500;
          border-radius: 10px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .home-sidebar .list-group-item svg {
          font-size: 1.3rem;
          margin-right: 10px;
        }
        .home-sidebar .list-group-item:hover {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
          transform: translateX(5px) scale(1.03);
        }
        .home-card {
          border-radius: 20px;
          box-shadow: 0 6px 24px 0 rgba(31, 38, 135, 0.10);
          border: none;
          background: rgba(255,255,255,0.95);
        }
        .home-card .card-body {
          padding: 3rem 2rem;
        }
        .home-title {
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(90deg, #6a82fb, #fc5c7d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .home-btn-lg {
          font-size: 1.15rem;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          box-shadow: 0 2px 8px rgba(31,38,135,0.08);
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .home-btn-lg svg {
          font-size: 1.2rem;
        }
        .home-btn-lg.btn-primary {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          border: none;
        }
        .home-btn-lg.btn-primary:hover {
          background: linear-gradient(90deg, #fc5c7d 0%, #6a82fb 100%);
          color: #fff;
          transform: scale(1.04);
        }
        .home-btn-lg.btn-warning {
          background: linear-gradient(90deg, #f7971e 0%, #ffd200 100%);
          border: none;
          color: #333;
        }
        .home-btn-lg.btn-warning:hover {
          background: linear-gradient(90deg, #ffd200 0%, #f7971e 100%);
          color: #222;
          transform: scale(1.04);
        }
        @media (max-width: 768px) {
          .home-sidebar {
            min-height: unset;
            margin-bottom: 1.5rem;
          }
          .home-card .card-body {
            padding: 2rem 1rem;
          }
          .home-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
      <div className="container my-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="home-sidebar">
              <h5 className="fw-bold mb-4">Menu</h5>
              <div className="list-group list-group-flush">
                <button 
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/new-order')}
                >
                  <FaShippingFast />
                  Đặt đơn mới
                </button>
                <button 
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/order-tracking')}
                >
                  <FaMapMarkerAlt />
                  Theo dõi đơn hàng
                </button>
                <button 
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/order-history')}
                >
                  <FaHistory />
                  Lịch sử đơn hàng
                </button>
                <button 
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/my-reports')}
                >
                  <FaExclamationTriangle />
                  Báo cáo của tôi
                </button>
                <button 
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/profile')}
                >
                  <FaUser />
                  Thông tin cá nhân
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            <div className="card home-card">
              <div className="card-body text-center py-5">
                <h2 className="mb-4 home-title">Chào mừng đến với Tốc Hành Hòa Lạc</h2>
                <p className="text-muted mb-4">Vui lòng chọn một chức năng từ menu bên trái để bắt đầu.</p>
                <div className="row justify-content-center">
                  <div className="col-md-4">
                    <button 
                      className="btn home-btn-lg btn-primary w-100 mb-3"
                      onClick={() => navigate('/new-order')}
                    >
                      <FaShippingFast className="me-2" />
                      Đặt đơn mới
                    </button>
                  </div>
                  <div className="col-md-4">
                    <button 
                      className="btn home-btn-lg btn-warning w-100 mb-3"
                      onClick={() => navigate('/order-tracking')}
                    >
                      <FaMapMarkerAlt className="me-2" />
                      Theo dõi đơn hàng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 