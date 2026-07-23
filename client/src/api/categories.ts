import { get } from './client'

export function getCategories() { return get<any[]>('/categories') }
