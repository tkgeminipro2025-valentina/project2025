import { supabase, isSupabaseConfigured } from './supabaseClient';
import { keysToCamel, keysToSnake } from '../utils';
import { 
    Organization, 
    Contact, 
    Deal, 
    Employee, 
    Product, 
    Project, 
    Task,
    DealStage
} from '../types';

// ====================================================================================
// Generic Error Handler
// ====================================================================================
const handleSupabaseError = (error: any, context: string) => {
    console.error(`Supabase error in ${context}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
    });
    throw new Error(`Failed to ${context}.`);
};

// ====================================================================================
// Helper to invoke the embedding Edge Function
// ====================================================================================
const generateEmbeddingInBackground = async (tableName: string, recordId: string, textToEmbed: string) => {
    if (!isSupabaseConfigured) {
        return;
    }
    try {
        const { error } = await supabase.functions.invoke('generate-embedding', {
            body: { tableName, recordId, textToEmbed },
        });
        if (error) {
            console.error('Error invoking embedding function:', error);
        }
    } catch (e) {
        console.error('Client-side error calling embedding function:', e);
    }
};


// ====================================================================================
// Generic Fetch Function
// ====================================================================================
async function fetchData<T>(table: string): Promise<T[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase client is not configured.');
  }
  try {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, `fetch ${table}`);
    return keysToCamel(data) as T[];
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    throw error;
  }
}

// ====================================================================================
// Generic Add Function
// ====================================================================================
async function addData<T extends { id: string }>(table: string, newItem: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    try {
        const { data, error } = await supabase
            .from(table)
            .insert(keysToSnake(newItem))
            .select()
            .single();

        if (error) handleSupabaseError(error, `add ${table}`);
        
        const result = keysToCamel(data) as T;
        
        // Asynchronously trigger embedding generation if description exists
        if ('description' in newItem && typeof newItem.description === 'string' && newItem.description) {
            generateEmbeddingInBackground(table, result.id, newItem.description);
        }

        return result;
    } catch (error) {
        console.error(`Error adding ${table}:`, error);
        throw error;
    }
}

// ====================================================================================
// Generic Update Function
// ====================================================================================
async function updateData<T extends { id: string }>(table: string, updatedItem: T): Promise<T> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    try {
        const { id, ...updateFields } = updatedItem;
        const { data, error } = await supabase
            .from(table)
            .update(keysToSnake(updateFields))
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error, `update ${table}`);
        
        const result = keysToCamel(data) as T;

        // Asynchronously trigger embedding generation if description exists and was part of the update
        if ('description' in updateFields && typeof updateFields.description === 'string' && updateFields.description) {
            generateEmbeddingInBackground(table, result.id, updateFields.description);
        }
        
        return result;
    } catch (error) {
        console.error(`Error updating ${table}:`, error);
        throw error;
    }
}

// ====================================================================================
// Generic Delete Function
// ====================================================================================
async function deleteData(table: string, id: string): Promise<void> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) handleSupabaseError(error, `delete ${table}`);
    } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
    }
}


// ====================================================================================
// Specific Implementations
// ====================================================================================

// Organizations
export const getOrganizations = () => fetchData<Organization>('organizations');
// FIX: Explicitly provide the generic type <Organization> to the addData function. This ensures that the return type is correctly inferred as Promise<Organization>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
export const addOrganization = (org: Omit<Organization, 'id' | 'createdAt' | 'descriptionEmbedding'>) => addData<Organization>('organizations', org);
export const updateOrganization = (org: Organization) => updateData('organizations', org);
export const deleteOrganization = (id: string) => deleteData('organizations', id);


// Contacts
export const getContacts = () => fetchData<Contact>('contacts');
// FIX: Explicitly provide the generic type <Contact> to the addData function. This ensures that the return type is correctly inferred as Promise<Contact>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
export const addContact = (contact: Omit<Contact, 'id' | 'createdAt'>) => addData<Contact>('contacts', contact);
export const updateContact = (contact: Contact) => updateData('contacts', contact);
export const deleteContact = (id: string) => deleteData('contacts', id);


// Deals
export const getDeals = () => fetchData<Deal>('deals');
// FIX: Explicitly provide the generic type <Deal> to the addData function. This ensures that the return type is correctly inferred as Promise<Deal>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
export const addDeal = (deal: Omit<Deal, 'id' | 'createdAt'>) => addData<Deal>('deals', deal);
export const updateDeal = (deal: Deal) => updateData('deals', deal);
export const updateDealStage = async (dealId: string, newStage: DealStage): Promise<Deal> => {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    try {
        const { data, error } = await supabase
            .from('deals')
            .update({ stage: newStage })
            .eq('id', dealId)
            .select()
            .single();
        if (error) handleSupabaseError(error, `update deal stage`);
        return keysToCamel(data) as Deal;
    } catch (error) {
        console.error(`Error updating deal stage:`, error);
        throw error;
    }
};
export const deleteDeal = (id: string) => deleteData('deals', id);


// Employees
export const getEmployees = async (): Promise<Employee[]> => {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    // Custom implementation to avoid ordering by 'created_at' which doesn't exist on employees
    try {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) handleSupabaseError(error, 'fetch employees');
        return keysToCamel(data) as Employee[];
    } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
    }
};
// FIX: Explicitly provide the generic type <Employee> to the addData function. This ensures that the return type is correctly inferred as Promise<Employee>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
export const addEmployee = (employee: Omit<Employee, 'id'>) => addData<Employee>('employees', employee);
export const updateEmployee = (employee: Employee) => updateData('employees', employee);
export const deleteEmployee = (id: string) => deleteData('employees', id);


// Products
export const getProducts = () => fetchData<Product>('products');
// FIX: Explicitly provide the generic type <Product> to the addData function. This ensures that the return type is correctly inferred as Promise<Product>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
export const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'descriptionEmbedding'>) => addData<Product>('products', product);
export const updateProduct = (product: Product) => updateData('products', product);
export const deleteProduct = (id: string) => deleteData('products', id);


// Projects
export const getProjects = () => fetchData<Project>('projects');
// FIX: Explicitly provide the generic type <Project> to the addData function. This ensures that the return type is correctly inferred as Promise<Project>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
export const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => addData<Project>('projects', project);
export const deleteProject = (id: string) => deleteData('projects', id);


// Tasks
export const getTasks = () => fetchData<Task>('tasks');
// FIX: Explicitly provide the generic type <Task> to the addData function. This ensures that the return type is correctly inferred as Promise<Task>, resolving downstream type errors where the return value was being inferred as Promise<{id: string}>.
// FIX: The task object from the form doesn't include 'status', so the parameter type is updated to reflect this. The 'status' is then added here with a default value before being sent to the database.
export const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => addData<Task>('tasks', { ...task, status: 'To Do' });
export const updateTask = (task: Task) => updateData('tasks', task);
export const deleteTask = (id: string) => deleteData('tasks', id);
