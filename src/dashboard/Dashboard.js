import * as XLSX from 'xlsx';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Menu, Button, Input, Modal, Form, Upload } from 'antd';
import { FileOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AutoComplete } from 'antd';


const { Header, Content, Footer, Sider } = Layout;

const Dashboard = () => {
  const [books, setBooks] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [visible, setVisible] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentBook, setCurrentBook] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [fileData, setFileData] = useState(null);



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

  const handleUserDashboardForm = () => {
    navigate('/dashboardUserControl')
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



  const handleImageChange = (file) => {
    setImageFile(file);
  };



  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleOk = async () => {
    if (!imageFile) {
      alert('Lütfen bir resim yükleyin.');
      return;
    }

    try {
      const values = await form.validateFields();
      const base64Image = await getBase64(imageFile);

      const bookData = {
        author: values.author,
        title: values.title,
        publisher: values.publisher,
        price: values.price,
        image: base64Image,
      };

      const token = sessionStorage.getItem('token');
      await axios.post('http://localhost:45329/Book/Create', bookData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setVisible(false); 
      fetchBooks(); 
      form.resetFields(); 
      setImageFile(null); 
    } catch (error) {
      console.error('Kitap ekleme hatası:', error);
    }
  };


  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
    setImageFile(null);
  };

  const handleDelete = async (bookId) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Token bulunamadı!');
      return;
    }

    try {
      const response = await axios.delete('http://localhost:45329/Book/Delete', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        data: {
          id: bookId,
        },
      });

      if (response.data.success) {
        
        setBooks(books.filter(book => book.id !== bookId));
        console.log('Kitap başarıyla silindi:', response.data);
      } else {
        console.error('Silme işlemi başarısız:', response.data.message);
      }
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu:', error.response ? error.response.data : error.message);
    }

  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const base64Image = imageFile ? await getExcelBase64(imageFile) : currentBook.image; // Yeni resim yoksa mevcut resmi kullan

      const bookData = {
        id: currentBook.id,
        author: values.author,
        title: values.title,
        publisher: values.publisher,
        price: values.price,
        image: base64Image,
      };

      const token = sessionStorage.getItem('token');
      await axios.put('http://localhost:45329/Book/Update', bookData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setEditVisible(false);
      fetchBooks();
      form.resetFields();
      setCurrentBook(null);
      setImageFile(null);
    } catch (error) {
      console.error('Kitap güncelleme hatası:', error);
    }
  };

  const handleFileChange = (file) => {
    setFileData(file);
  };

  const handleUpload = async () => {
    if (!fileData) {
      alert('Lütfen bir dosya yükleyin!');
      return;
    }
  
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
  
      const sheetName = workbook.SheetNames[0]; // İlk sayfa
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Satırları al
  
      const booksData = await Promise.all(jsonData.map(async (row, index) => {
        if (index === 0) return null; // Başlık satırını geç
  
        const [author, title, publisher, price, imagePath] = row; // Resim yolu buradan alınıyor
  
        let base64Image = '';
        if (imagePath) {
          base64Image = await getBase64FromImagePath(imagePath); // Resim yolundan base64'e çevir
        }
  
        return {
          author,
          title,
          publisher,
          price,
          image: base64Image, // Base64 string'i buraya atanır
        };
      }));
  
      // Sadece geçerli verileri alalım (null olanları filtrele)
      const validBooks = booksData.filter(book => book);
  
      const token = sessionStorage.getItem('token');
      try {
        await axios.post('http://localhost:45329/Book/CreateBookFiles', validBooks, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        setUploadVisible(false); // Modal'ı kapat
        fetchBooks(); // Kitapları tekrar getir
        alert('Dosya başarıyla yüklendi!');
      } catch (error) {
        console.error('Dosya yükleme hatası:', error);
      }
    };
  
    reader.readAsArrayBuffer(fileData); // Dosyayı oku
  };
  
  const getBase64FromImagePath = (imagePath) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.open('GET', imagePath);
      xhr.responseType = 'blob';
      xhr.send();
    });
  };
  

  const getExcelBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };
  


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['2']}>
          <Menu.Item key="2" icon={<FileOutlined />}>Kitaplar</Menu.Item>
          <Menu.Item key="3" onClick={handleUserDashboardForm} icon={<UsergroupAddOutlined />}>Kullanıcılar</Menu.Item>
        </Menu>
      </Sider>
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
            <h1>Admin Konsol Uygulamasına Hoşgeldiniz, {userInfo ? `${userInfo.name} ${userInfo.surname} (${userInfo.role})` : 'Kullanıcı'}!</h1>

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
                      <Button
                        style={{ marginRight: '10px' }}
                        type="primary"
                        onClick={() => {
                          setEditVisible(true);
                          setCurrentBook(book); 
                        }}
                      >
                        Güncelle
                      </Button>
                      <Button
                        style={{ marginRight: '10px' }}
                        type='primary'
                        danger
                        onClick={() => handleDelete(book.id)} 
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Button type="primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setVisible(true)}>Kitap Ekle</Button>
            <Button
              type="primary"
              style={{ width: '100%', marginTop: '10px' }}  
              onClick={() => setUploadVisible(true)}
            >
              Dosya ile Kitap Yükle
            </Button>
          </div>

        </Content>
        <Footer style={{ textAlign: 'center' }}>Okay KUZUCU</Footer>
      </Layout>

      <Modal
        title="Kitap Ekle"
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="author" label="Yazar" rules={[{ required: true, message: 'Lütfen yazar ismini girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Başlık" rules={[{ required: true, message: 'Lütfen kitap başlığını girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="publisher" label="Yayın Evi" rules={[{ required: true, message: 'Lütfen yayın evini girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Fiyat" rules={[{ required: true, message: 'Lütfen fiyatı girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Resim">
            <Upload
              beforeUpload={(file) => {
                handleImageChange(file);
                return false; 
              }}
              accept="image/*"
              showUploadList={false}
            >
              <Button>Resim Yükle</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kitap Güncelle"
        visible={editVisible}
        onOk={handleUpdate}
        onCancel={() => setEditVisible(false)}
      >
        <Form form={form} layout="vertical" initialValues={currentBook}>
          <Form.Item name="author" label="Yazar" rules={[{ required: true, message: 'Lütfen yazar ismini girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Başlık" rules={[{ required: true, message: 'Lütfen kitap başlığını girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="publisher" label="Yayın Evi" rules={[{ required: true, message: 'Lütfen yayın evini girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Fiyat" rules={[{ required: true, message: 'Lütfen fiyatı girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Kapak Resmi">
            <Upload accept="image/*" showUploadList={false} onChange={handleImageChange}>
              <Button>Resim Yükle</Button>
            </Upload>
            {imageFile && <div style={{ marginTop: '10px' }}>Yüklenen Resim: {imageFile.name}</div>}
            {currentBook && currentBook.image && (
              <div style={{ marginTop: '10px' }}>
                <strong>Mevcut Resim:</strong>
                <img src={`data:image/png;base64,${currentBook.image}`} alt="Current" style={{ width: '100px', height: 'auto', marginLeft: '10px' }} />
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Dosya ile Kitap Yükle"
        visible={uploadVisible}
        onOk={handleUpload}
        onCancel={() => setUploadVisible(false)}
      >
        <Upload
          beforeUpload={(file) => {
            handleFileChange(file);
            return false;
          }}
          accept=".xlsx, .csv"
        >
          <Button>Dosya Seç</Button>
        </Upload>
      </Modal>


    </Layout>
  );
};

export default Dashboard;
