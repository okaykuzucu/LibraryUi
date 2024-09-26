import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Input, Row } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    const loginData = {
      email: values.username,
      password: values.password,
    };
  
    try {
      const response = await axios.post('http://localhost:45329/Login', loginData);
  
      if (response.status === 200 && response.data.data.role === 'Admin') {
        sessionStorage.setItem('token', response.data.data.token);
        sessionStorage.setItem('user', JSON.stringify({
          name: response.data.data.name,
          surname: response.data.data.surname,
          role: response.data.data.role,
        }));
  
        navigate('/dashboard');
      }
      if (response.status === 200 && response.data.data.role === 'User')
      {
        sessionStorage.setItem('token', response.data.data.token);
        sessionStorage.setItem('user', JSON.stringify({
          name: response.data.data.name,
          surname: response.data.data.surname,
          role: response.data.data.role,
        }));
  
        navigate('/userDashboard');
      }
      else {
        setErrorMessage('Giriş başarısız. Lütfen tekrar deneyin.');
      }
      
    } catch (error) {
      setErrorMessage('Giriş başarısız. Lütfen tekrar deneyin.');
      console.error('Login error:', error);
    }
  };

  return (
    <Row style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Col>
        <Card style={{ width: 380, height: 420 }}>
          <div style={{ textAlign: "center" }}>
            <h2>Kütüphane Uygulaması</h2>
            <h3>Giriş Yap</h3>
          </div>
          <Form name="normal_login" className="login-form" onFinish={handleSubmit}>
            <Form.Item name="username" rules={[{ type: "email", required: true, message: 'Lütfen düzgün bir e-posta adresi giriniz!' }]}>
              <Input size="large" prefix={<UserOutlined className="site-form-item-icon" />} placeholder="E-posta" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Şifre alanı boş bırakılamaz' }]}>
              <Input prefix={<LockOutlined className="site-form-item-icon" />} type="password" autoComplete="current-password" size="large" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Item>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <Form.Item>
              <Button size="large" type="primary" htmlType="submit" className="login-form-button" block>
                Giriş Yap
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;
