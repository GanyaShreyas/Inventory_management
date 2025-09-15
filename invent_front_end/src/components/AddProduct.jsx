// import React, { useMemo, useState } from 'react';
// import styles from './styles.module.css';

// function AddProduct({ onBack }) {
//   const currentDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
//   const [formData, setFormData] = useState({
//     name: '',
//     in: '',
//     out: '',
//     field1: '',
//     field2: '',
//     field3: '',
//     field4: '',
//     field5: '',
//     field6: '',
//     field7: '',
//     field8: currentDate,
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:8000/api/items/add/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });
//       if (response.ok) {
//         alert('Product sent successfully!');
//       } else {
//         alert('Failed to send product.');
//       }
//     } catch (error) {
//       console.error('Error sending product:', error);
//       alert('Error sending product: ' + error.message);
//     }

//     // Optionally clear form
//     setFormData({ ...formData, name: '', in: '', out: '', field1: '', field2: '', field3: '', field4: '', field5: '', field6: '', field7: '', field8: currentDate });
//   };

//   return (
//     <div className={styles.addProductContent}>
//       <h2 className={styles.addProductTitle}>Add New Product</h2>
//       <form className={styles.addProductForm} onSubmit={handleSave}>
//         <label>
//           Product Name:
//           <input name="name" type="text" className={styles.inputField} value={formData.name} onChange={handleChange} />
//         </label>
//         <label>
//           IN:
//           <input name="in" type="number" className={styles.inputField} value={formData.in} onChange={handleChange} />
//         </label>
//         <label>
//           Out:
//           <input name="out" type="number" className={styles.inputField} value={formData.out} onChange={handleChange} />
//         </label>
//         <label>
//           Field 1:
//           <input name="field1" type="text" className={styles.inputField} value={formData.field1} onChange={handleChange} />
//         </label>
//         <label>
//           Field 2:
//           <input name="field2" type="text" className={styles.inputField} value={formData.field2} onChange={handleChange} />
//         </label>
//         <label>
//           Field 3:
//           <input name="field3" type="text" className={styles.inputField} value={formData.field3} onChange={handleChange} />
//         </label>
//         <label>
//           Field 4:
//           <input name="field4" type="text" className={styles.inputField} value={formData.field4} onChange={handleChange} />
//         </label>
//         <label>
//           Field 5:
//           <input name="field5" type="text" className={styles.inputField} value={formData.field5} onChange={handleChange} />
//         </label>
//         <label>
//           Field 6:
//           <input name="field6" type="text" className={styles.inputField} value={formData.field6} onChange={handleChange} />
//         </label>
//         <label>
//           Field 7:
//           <input name="field7" type="text" className={styles.inputField} value={formData.field7} onChange={handleChange} />
//         </label>
//         <label>
//           Field 8 (Date):
//           <input
//             name="field8"
//             type="date"
//             className={styles.inputField}
//             value={formData.field8}
//             onChange={handleChange}
//             max={currentDate}
//           />
//         </label>
//         <div className={styles.addProductActions}>
//           <button type="button" className={styles.actionBtn} onClick={onBack}>Cancel</button>
//           <button type="submit" className={styles.actionBtn}>Save</button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AddProduct;
