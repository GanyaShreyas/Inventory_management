import {reactive, useState, useEffect} from 'react';
import styles from './styles.module.css';
import { apiBase, authHeaders } from '../apiConfig';

function formElemnts() {
    const MultiSelectAutocomplete = (value, onChange) => {
        const [projectOptions, setProjectOptions] = useState([]);
        const fetchProjects = async () => {
            const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: { ...authHeaders() } });
            const data = await res.json();
            setProjectOptions(data.projects || []);
        };
        return (
            <select 
                className={styles.control} 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                onFocus={fetchProjects} required>
                <option value="">SELECT PROJECT</option>
                {projectOptions.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
            </select>
        );
    }
    return {MultiSelectAutocomplete};
}

export default formElemnts;