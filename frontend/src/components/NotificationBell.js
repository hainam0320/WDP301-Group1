import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await notificationAPI.getNotifications();
            if (response.data) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Lắng nghe sự kiện custom để fetch lại thông báo
        const handleNewNotification = () => fetchNotifications();
        window.addEventListener('new-notification', handleNewNotification);

        // Dọn dẹp
        return () => {
            window.removeEventListener('new-notification', handleNewNotification);
        };
    }, [fetchNotifications]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Có thể tự động đánh dấu đã đọc khi mở, hoặc để người dùng tự click
        }
    };

    const handleMarkAndNavigate = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationAPI.markAsRead(notification._id);
                fetchNotifications();
            } catch (error) {
                console.error('Failed to mark notification as read', error);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'ORDER_ACCEPTED':
                return 'bi-box-seam text-primary';
            case 'REPORT_UPDATED':
                return 'bi-shield-check text-success';
            default:
                return 'bi-bell-fill text-secondary';
        }
    };

    return (
        <>
            <style>
                {`
                .notifications .notification-item {
                    padding: 10px 15px;
                    transition: background-color 0.2s ease;
                }
                .notifications .notification-item:hover {
                    background-color: #f8f9fa;
                }
                .notifications .notification-item.unread {
                    background-color: #eaf6ff;
                }
                .notifications .notification-item p {
                    font-size: 0.85rem;
                    color: #6c757d;
                    margin-bottom: 2px;
                }
                .notifications .notification-time {
                    font-size: 0.75rem;
                    color: #999;
                }
                .dropdown-menu-notifications {
                    width: 350px;
                    max-height: 400px;
                    overflow-y: auto;
                    border-radius: 0.5rem;
                    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15)!important;
                }
                .dropdown-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                `}
            </style>
            <li className="nav-item dropdown">
                <a className="nav-link nav-icon" href="#" onClick={handleToggle}>
                    <i className="bi bi-bell"></i>
                    {unreadCount > 0 && <span className="badge bg-primary badge-number">{unreadCount}</span>}
                </a>

                {isOpen && (
                    <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow dropdown-menu-notifications notifications show" style={{ position: 'absolute', right: '15px', top: '100%' }}>
                        <li className="dropdown-header">
                            <span className="fw-bold">Bạn có {unreadCount} thông báo mới</span>
                            <div>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleMarkAllAsRead(); }} title="Đánh dấu tất cả đã đọc">
                                    <small>Đánh dấu đã đọc</small>
                                </a>
                                <i className="bi bi-x-circle ms-2" style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} title="Đóng"></i>
                            </div>
                        </li>
                        <li><hr className="dropdown-divider my-0" /></li>

                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <Fragment key={notif._id}>
                                    <li className={`notification-item d-flex align-items-start ${!notif.isRead ? 'unread' : ''}`}>
                                        <i className={`bi ${getIconForType(notif.type)} me-3 mt-1`}></i>
                                        <div className="flex-grow-1">
                                            <Link to={notif.link || '#'} onClick={() => handleMarkAndNavigate(notif)} className="text-decoration-none text-dark">
                                                <h6 className={`mb-1 ${!notif.isRead ? 'fw-bold' : ''}`}>{notif.title}</h6>
                                                <p>{notif.message}</p>
                                                <div className="notification-time">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                                </div>
                                            </Link>
                                        </div>
                                    </li>
                                    <li><hr className="dropdown-divider my-0" /></li>
                                </Fragment>
                            ))
                        ) : (
                            <li className="text-center text-muted p-4">
                                <i className="bi bi-check2-circle fs-3 d-block mb-2"></i>
                                Không có thông báo mới
                            </li>
                        )}

                        <li className="dropdown-footer text-center py-2">
                            {/* <Link to="/notifications">Xem tất cả</Link> */}
                        </li>
                    </ul>
                )}
            </li>
        </>
    );
};

export default NotificationBell; 