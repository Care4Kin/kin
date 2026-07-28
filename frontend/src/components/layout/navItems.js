import { DollarSign, MessageCircle, Home, Pill, Flag, Users } from 'lucide-react'

export const navItems = [
  { to: '/bills',         label: 'Bills',    icon: DollarSign },
  { to: '/ask-kin',       label: 'Ask Kin',  icon: MessageCircle },
  { to: '/dashboard',     label: 'Home',     icon: Home },
  { to: '/prescriptions', label: 'Meds',     icon: Pill },
  { to: '/flags',         label: 'Alerts',   icon: Flag },
  { to: '/circle',        label: 'Circle',   icon: Users },
]
