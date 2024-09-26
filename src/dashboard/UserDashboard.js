import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Button, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AutoComplete } from 'antd';

const { Header, Content, Footer } = Layout;

const Dashboard = () => {
  const [books, setBooks] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      setUserInfo(JSON.parse(user));
    }
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Token bulunamadı!');
      return;
    }

    try {
      const response = await axios.get('http://localhost:45329/Book/GetAll', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response && response.data) {
        setBooks(response.data.data);
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

  const handleSearch = (value) => {
    if (value.length < 3) {
      fetchBooks();
      return;
    }

    const filteredBooks = books.filter(book =>
      book.title.toLowerCase().includes(value.toLowerCase()) ||
      book.author.toLowerCase().includes(value.toLowerCase())
    );

    setBooks(filteredBooks);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      <Layout>
        <Header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
          <div className="logo" />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AutoComplete
              style={{ width: 250, marginRight: '10px', marginBottom: '16px' }}
              options={books.map(book => ({
                value: book.title,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src={`data:image/png;base64,${book.image}`}
                      alt={book.title}
                      style={{ width: '50px', height: 'auto', marginRight: '10px' }}
                    />
                    {book.title}
                  </div>
                ),
              }))}
              onSearch={handleSearch} 
              onSelect={handleSearch} 
            />
            <Button type="primary" onClick={handleLogout} style={{ marginBottom: '16px' }}>Çıkış</Button>
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            <h1>Kütphane Uygulamasına Hoşgeldiniz, {userInfo ? `${userInfo.name} ${userInfo.surname} (${userInfo.role})` : 'Kullanıcı'}!</h1>

            <h2>Kitaplar:</h2>
            <ul>
              {books.map(book => (
                <li key={book.id} style={{ display: 'flex', borderBottom: '1px solid #ddd', padding: '10px 0' }}>
                  <img
                    src={`data:image/png;base64,${book.image}`}
                    alt={book.title}
                    style={{ width: '100px', height: 'auto', marginRight: '20px' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                      <strong>Yazar:</strong> {book.author}<br />
                      <strong>Yayın Evi:</strong> {book.publisher}<br />
                      <strong>Fiyat:</strong> {book.price}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Okay KUZUCU</Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
