import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuthService, getAdminUser, adminProductService } from '../services/adminApi';
import './AdminProducts.css';

const initialFormState = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: '',
  stockQuantity: ''
};

export function AdminProducts() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminProductService.getAllProducts();
      setProducts(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/admin/login');
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      stockQuantity: product.stockQuantity?.toString() || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormState);
    setFormError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl.trim(),
        category: formData.category.trim(),
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0
      };

      if (!productData.name) {
        throw new Error('Product name is required');
      }
      if (isNaN(productData.price) || productData.price <= 0) {
        throw new Error('Valid price is required');
      }

      if (editingProduct) {
        await adminProductService.updateProduct(editingProduct.id, productData);
      } else {
        await adminProductService.createProduct(productData);
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await adminProductService.deleteProduct(productId);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>GROOMUP</h2>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-item">
            <span className="nav-icon">&#9632;</span>
            Dashboard
          </Link>
          <Link to="/admin/products" className="admin-nav-item active">
            <span className="nav-icon">&#9642;</span>
            Products
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Products</h1>
          <div className="admin-user-info">
            <span>{adminUser?.email || 'Admin'}</span>
          </div>
        </header>

        <div className="admin-content">
          <div className="products-toolbar">
            <button onClick={openCreateModal} className="btn-primary">
              + Add Product
            </button>
          </div>

          {error && <div className="admin-error">{error}</div>}

          {loading ? (
            <div className="admin-loading">Loading products...</div>
          ) : (
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">No products found</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="product-thumb"
                          />
                        </td>
                        <td>{product.name}</td>
                        <td>{product.category || '-'}</td>
                        <td>Rs. {product.price?.toFixed(2)}</td>
                        <td>{product.stockQuantity ?? '-'}</td>
                        <td className="actions-cell">
                          <button
                            onClick={() => openEditModal(product)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeModal} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price (Rs.) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="stockQuantity">Stock Quantity</label>
                  <input
                    type="number"
                    id="stockQuantity"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product?</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="delete-actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-delete-confirm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
