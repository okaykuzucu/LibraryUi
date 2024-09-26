import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Menu, Button, Input, Modal, Form, Upload } from 'antd';
import { FileOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import { AutoComplete } from 'antd';

const { Header, Content, Footer, Sider } = Layout;

const UserDashboard = () => {
    const [users, setUsers] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [currentUser, setCurrentUser] = useState(null);
    const [editVisible, setEditVisible] = useState(false);

    const roleOptions = [
        { label: 'Admin', value: 1 },
        { label: 'Client', value: 2 },
        { label: 'User', value: 3 },
    ];

    useEffect(() => {
        const user = sessionStorage.getItem('user');
        if (user) {
            setUserInfo(JSON.parse(user));
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            console.error('Token bulunamadı!');
            return;
        }

        try {
            const response = await axios.get('http://localhost:45329/User/GetAll', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            if (response && response.data) {
                setUsers(response.data.data);
            } else {
                console.error('Response verisi yok:', response);
            }
        } catch (error) {
            console.error('Error fetching books:', error.response ? error.response.data : error.message);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleDashboard = () => {
        navigate('/dashboard');
    };

    const handleSearch = (value) => {
        console.log("Arama yapılıyor:", value);
    
    };

    const createUser = async () => {
        const values = await form.validateFields();

        const userData = {
            name: values.name,
            surname: values.surname,
            email: values.email,
            role: values.role,
            password: values.password
        };
        const token = sessionStorage.getItem('token');
        await axios.post('http://localhost:45329/User/Create', userData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        setVisible(false);
        fetchUsers();
        form.resetFields();
    }

    const handleCancel = () => {
        setVisible(false);
        form.resetFields();
    }


    const userDelete = async (userId) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            console.error('Token Yok');
            return;
        }

        const response = await axios.delete('http://localhost:45329/User/Delete', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            data: {
                id: userId,
            },
        });

        if (response.data.success) {
            setUsers(users.filter(user => user.id !== userId));
            console.log('Kitap başarıyla silindi:', response.data);
        } else {
            console.error('Silme işlemi başarısız:', response.data.message);
        }
    };

    const userUpdate = async () => {
        try {
            const values = await form.validateFields();

            const userData = {
                id: currentUser.id,
                name: values.name,
                surname: values.surname,
                email: values.email,
                role: values.role,
                password: values.password 
            };

            const token = sessionStorage.getItem('token');
            await axios.put('http://localhost:45329/User/Update', userData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            setEditVisible(false);
            fetchUsers();
            form.resetFields();
            setCurrentUser(null);

        } catch (error) {
            console.error('Kitap güncelleme hatası:', error);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider>
                <div className="logo" />
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['3']}>
                    <Menu.Item key="2" onClick={handleDashboard} icon={<FileOutlined />}>Kitaplar</Menu.Item>
                    <Menu.Item key="3" icon={<UsergroupAddOutlined />}>Kullanıcılar</Menu.Item>
                </Menu>
            </Sider>
            <Layout>
                <Header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
                    <div className="logo" />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Input.Search
                            placeholder="Kitap ara..."
                            onSearch={handleSearch}
                            style={{ width: 250, marginRight: '10px', marginBottom: '16px' }}
                        />
                        <Button type="primary" onClick={handleLogout} style={{ marginBottom: '16px' }}>Çıkış</Button>
                    </div>
                </Header>
                <Content style={{ margin: '16px' }}>
                    <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
                        <h1>Admin Konsol Uygulamasına Hoşgeldiniz, {userInfo ? `${userInfo.name} ${userInfo.surname} (${userInfo.role})` : 'Kullanıcı'}!</h1>
                        <h2>Kullanıcılar:</h2>
                        <ul>
                            {users.map(user => (
                                <li key={user.id} style={{ display: 'flex', borderBottom: '1px solid #ddd', padding: '10px 0' }}>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                                            <strong>Ad:</strong> {user.name}<br />
                                            <strong>Soyad:</strong> {user.surname}<br />
                                            <strong>Email:</strong> {user.email}<br />
                                            <strong>Role:</strong> {user.role}<br />
                                            
                                        </div>
                                        <div style={{ marginTop: '10px' }}>
                                            <Button
                                                style={{ marginRight: '10px' }}
                                                type="primary"
                                                onClick={() => {
                                                    setCurrentUser(user);
                                                    form.setFieldsValue({
                                                        name: user.name,
                                                        surname: user.surname,
                                                        email: user.email,
                                                        role: user.role,
                                                        //password: user.password,
                                                    });
                                                    setEditVisible(true);
                                                }}
                                            >
                                                Güncelle
                                            </Button>

                                            <Button
                                                style={{ marginRight: '10px' }}
                                                type='primary'
                                                danger
                                                onClick={() => userDelete(user.id)}
                                            >
                                                Sil
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Button type="primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setVisible(true)}>Kullanıcı Ekle</Button>

                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>Okay KUZUCU</Footer>
            </Layout>

            <Modal
                title="Kullanıcı Ekle"
                visible={visible}
                onOk={createUser}
                onCancel={handleCancel}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Adı" rules={[{ required: true, message: 'Lütfen yazar ismini girin.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="surname" label="Soyadı" rules={[{ required: true, message: 'Lütfen kitap başlığını girin.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Lütfen yayın evini girin.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Lütfen rolü seçin.' }]}
                    >
                        <Select options={roleOptions} />
                    </Form.Item>
                    <Form.Item name="password" label="Şifre" rules={[{ required: true, message: 'Lütfen fiyatı girin.' }]}>
                        <Input />
                    </Form.Item>

                </Form>
            </Modal>

            <Modal
                title="Kullanıcı Güncelle"
                visible={editVisible}
                onOk={userUpdate}
                onCancel={() => setEditVisible(false)}
            >
                <Form form={form} layout="vertical" initialValues={currentUser}>
                    <Form.Item name="name" label="Adı" rules={[{ required: true, message: 'Lütfen yazar ismini girin.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="surname" label="Soyadı" rules={[{ required: true, message: 'Lütfen kitap başlığını girin.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Lütfen yayın evini girin.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Lütfen rolü seçin.' }]}
                    >
                        <Select options={roleOptions} />
                    </Form.Item>
                    <Form.Item name="password" label="Şifresi" rules={[{ required: true, message: 'Lütfen fiyatı girin.' }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );


};

export default UserDashboard;