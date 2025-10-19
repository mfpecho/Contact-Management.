import { supabase, TABLES, DatabaseUser, DatabaseContact, DatabaseChangelog } from './supabase'
import { User, Contact, ChangelogEntry, UserRole } from '../types'
import bcrypt from 'bcryptjs'

// Transform database user to app user type
const transformDbUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  password: dbUser.password_hash,
  role: dbUser.role as UserRole,
  name: dbUser.name,
  username: dbUser.username,
  employeeNumber: dbUser.employee_number,
  position: dbUser.position,
  avatar: dbUser.avatar
})

// Transform database contact to app contact type
const transformDbContact = (dbContact: DatabaseContact): Contact => ({
  id: dbContact.id,
  firstName: dbContact.first_name,
  middleName: dbContact.middle_name || '',
  lastName: dbContact.last_name,
  birthday: dbContact.birthday,
  contactNumber: dbContact.phone || '',
  company: dbContact.company || '',
  ownerId: dbContact.user_id,
  ownerName: '', // Will need to join with users table or fetch separately
  createdAt: dbContact.created_at
})

// Transform database changelog to app changelog type
const transformDbChangelog = (dbChangelog: DatabaseChangelog): ChangelogEntry => ({
  id: dbChangelog.id,
  timestamp: dbChangelog.timestamp,
  userId: dbChangelog.user_id,
  userName: dbChangelog.user_name,
  userRole: dbChangelog.user_role as UserRole,
  action: dbChangelog.action,
  entity: dbChangelog.entity,
  entityId: dbChangelog.entity_id,
  entityName: dbChangelog.entity_name,
  description: dbChangelog.description,
  details: dbChangelog.details
})

export class DatabaseService {
  // User operations
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('name')

    if (error) throw error
    return data.map(transformDbUser)
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return transformDbUser(data)
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return transformDbUser(data)
  }

  static async createUser(userData: Omit<User, 'id'>): Promise<User> {
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10)

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert({
        email: userData.email,
        password_hash: passwordHash,
        role: userData.role,
        name: userData.name,
        username: userData.username,
        employee_number: userData.employeeNumber,
        position: userData.position,
        avatar: userData.avatar
      })
      .select()
      .single()

    if (error) throw error
    return transformDbUser(data)
  }

  static async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    const updateData: Record<string, string> = {}
    
    if (userData.email) updateData.email = userData.email
    if (userData.password) updateData.password_hash = await bcrypt.hash(userData.password, 10)
    if (userData.role) updateData.role = userData.role
    if (userData.name) updateData.name = userData.name
    if (userData.username) updateData.username = userData.username
    if (userData.employeeNumber) updateData.employee_number = userData.employeeNumber
    if (userData.position) updateData.position = userData.position
    if (userData.avatar) updateData.avatar = userData.avatar

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformDbUser(data)
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.USERS)
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email)
    if (!user) return null

    const isValid = await bcrypt.compare(password, user.password)
    return isValid ? user : null
  }

  // Contact operations
  static async getContacts(userId?: string): Promise<Contact[]> {
    let query = supabase.from(TABLES.CONTACTS).select('*').order('first_name')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data.map(transformDbContact)
  }

  static async getContactById(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return transformDbContact(data)
  }

  static async createContact(contactData: Omit<Contact, 'id'>, userId: string): Promise<Contact> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .insert({
        first_name: contactData.firstName,
        middle_name: contactData.middleName || null,
        last_name: contactData.lastName,
        birthday: contactData.birthday,
        phone: contactData.contactNumber || null,
        company: contactData.company || null,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw error
    return transformDbContact(data)
  }

  static async updateContact(id: string, contactData: Partial<Omit<Contact, 'id'>>): Promise<Contact> {
    const updateData: Record<string, string | null> = {}
    
    if (contactData.firstName) updateData.first_name = contactData.firstName
    if (contactData.middleName !== undefined) updateData.middle_name = contactData.middleName || null
    if (contactData.lastName) updateData.last_name = contactData.lastName
    if (contactData.birthday) updateData.birthday = contactData.birthday
    if (contactData.contactNumber !== undefined) updateData.phone = contactData.contactNumber || null
    if (contactData.company !== undefined) updateData.company = contactData.company || null

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformDbContact(data)
  }

  static async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Changelog operations
  static async getChangelog(): Promise<ChangelogEntry[]> {
    const { data, error } = await supabase
      .from(TABLES.CHANGELOG)
      .select('*')
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data.map(transformDbChangelog)
  }

  static async logAction(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: ChangelogEntry['action'],
    entity: ChangelogEntry['entity'],
    description: string,
    entityId?: string,
    entityName?: string,
    details?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('log_changelog', {
      p_user_id: userId,
      p_user_name: userName,
      p_user_role: userRole,
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId || null,
      p_entity_name: entityName || null,
      p_description: description,
      p_details: details || null
    })

    if (error) throw error
  }
}