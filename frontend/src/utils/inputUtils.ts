/**
 * Utilitários para máscaras, validações e sanitização de inputs
 */

// ============================================
// SANITIZAÇÃO (Prevenção de XSS e Injection)
// ============================================

/**
 * Remove caracteres perigosos e sanitiza strings
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  
  return input
    // Remove tags HTML
    .replace(/<[^>]*>/g, '')
    // Remove scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove eventos JavaScript
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove caracteres de controle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove caracteres especiais perigosos
    .replace(/[<>'"&]/g, '')
    .trim()
}

/**
 * Sanitiza mas mantém alguns caracteres especiais necessários
 * Permite caracteres acentuados e especiais do português (ç, ~, ^, ´, `)
 */
export const sanitizeText = (input: string, allowSpecialChars: string[] = []): string => {
  if (!input || typeof input !== 'string') return ''
  
  let sanitized = input
    // Remove tags HTML
    .replace(/<[^>]*>/g, '')
    // Remove scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove eventos JavaScript
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove caracteres de controle (exceto quebra de linha e tab)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  // Se houver caracteres permitidos, não remove
  if (allowSpecialChars.length > 0) {
    // Mantém caracteres alfanuméricos, espaços, caracteres acentuados, marcas diacríticas e caracteres permitidos
    // Permite: letras (incluindo acentuadas), números, espaços, quebras de linha, tabs, marcas diacríticas
    // e caracteres especiais permitidos explicitamente
    // \p{L} = letras (inclui acentuadas como á, é, ç, ã, etc.)
    // \p{N} = números
    // \p{M} = marcas diacríticas (como ~, ^, ´, `)
    // \s = espaços em branco
    sanitized = sanitized.replace(/[^\p{L}\p{N}\p{M}\s\n\t]/gu, (char) => {
      return allowSpecialChars.includes(char) ? char : ''
    })
  } else {
    // Remove apenas caracteres perigosos, mantendo acentos e caracteres especiais do português
    // Permite letras (incluindo acentuadas), números, espaços, marcas diacríticas e pontuação comum
    sanitized = sanitized.replace(/[<>'"&]/g, '') // Remove apenas caracteres perigosos para XSS
    // Não remove outros caracteres quando não há allowSpecialChars, mantém tudo exceto os perigosos
  }
  
  return sanitized
}

/**
 * Sanitiza URL
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return ''
  
  // Remove protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = url.toLowerCase().trim()
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return ''
    }
  }
  
  // Valida formato de URL básico
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    // Permite apenas http e https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return ''
    }
    return urlObj.toString()
  } catch {
    // Se não for URL válida, retorna sanitizada
    return sanitizeInput(url)
  }
}

// ============================================
// MÁSCARAS
// ============================================

/**
 * Máscara de telefone brasileiro
 */
export const maskPhone = (value: string): string => {
  if (!value) return ''
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Aplica máscara baseado no tamanho
  if (numbers.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  } else {
    // Celular: (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }
}

/**
 * Máscara de CPF
 */
export const maskCPF = (value: string): string => {
  if (!value) return ''
  
  const numbers = value.replace(/\D/g, '')
  
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

/**
 * Máscara de CNPJ
 */
export const maskCNPJ = (value: string): string => {
  if (!value) return ''
  
  const numbers = value.replace(/\D/g, '')
  
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

/**
 * Máscara de CEP
 */
export const maskCEP = (value: string): string => {
  if (!value) return ''
  
  const numbers = value.replace(/\D/g, '')
  
  return numbers
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1')
}

/**
 * Máscara de CAU (Registro Profissional)
 * Formato: CAU/UF A00000-0
 * Exemplo: CAU/SP A12345-6
 */
export const maskCAU = (value: string): string => {
  if (!value) return ''
  
  // Remove tudo exceto letras e números, mas mantém a estrutura se já tiver "CAU/"
  let cleaned = value.toUpperCase()
  
  // Se já começar com "CAU/", processa apenas o que vem depois
  if (cleaned.startsWith('CAU/')) {
    cleaned = cleaned.slice(4) // Remove "CAU/"
  } else if (cleaned.startsWith('CAU')) {
    cleaned = cleaned.slice(3) // Remove "CAU" sem a barra
  }
  
  // Remove espaços e caracteres especiais, mantendo apenas letras e números
  cleaned = cleaned.replace(/[^A-Z0-9]/g, '')
  
  // Se não tiver conteúdo, retorna apenas "CAU/"
  if (cleaned.length === 0) return 'CAU/'
  
  // Formato esperado: UF (2 letras) + A (1 letra) + 6 dígitos
  // Extrai UF (primeiras 2 letras)
  const ufMatch = cleaned.match(/^([A-Z]{0,2})/)
  const uf = ufMatch ? ufMatch[1] : ''
  let remaining = cleaned.slice(uf.length)
  
  // Extrai a letra inicial (A, B, C, etc.) - apenas uma letra
  const letterMatch = remaining.match(/^([A-Z]{0,1})/)
  const letter = letterMatch ? letterMatch[1] : ''
  remaining = remaining.slice(letter.length)
  
  // Extrai os números (máximo 6 dígitos: 5 + 1)
  const numbers = remaining.replace(/\D/g, '').slice(0, 6)
  
  // Monta a máscara
  let masked = 'CAU/'
  
  // Adiciona UF (2 letras)
  if (uf.length > 0) {
    masked += uf.slice(0, 2)
  }
  
  // Adiciona espaço após UF se houver letra ou números
  if ((uf.length >= 2 || uf.length > 0) && (letter.length > 0 || numbers.length > 0)) {
    masked += ' '
  }
  
  // Adiciona letra inicial
  if (letter.length > 0) {
    masked += letter
  }
  
  // Adiciona números com hífen após 5 dígitos
  if (numbers.length > 0) {
    if (numbers.length <= 5) {
      masked += numbers
    } else {
      masked += numbers.slice(0, 5) + '-' + numbers.slice(5, 6)
    }
  }
  
  return masked
}

/**
 * Remove máscara (retorna apenas números)
 */
export const unmask = (value: string): string => {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

// ============================================
// VALIDAÇÕES
// ============================================

/**
 * Valida email
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Valida telefone brasileiro
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false
  const numbers = unmask(phone)
  // Telefone fixo (10 dígitos) ou celular (11 dígitos)
  return numbers.length === 10 || numbers.length === 11
}

/**
 * Valida CPF
 */
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false
  const numbers = unmask(cpf)
  
  if (numbers.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(numbers.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(numbers.charAt(10))) return false
  
  return true
}

/**
 * Valida CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj) return false
  const numbers = unmask(cnpj)
  
  if (numbers.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false
  
  // Validação dos dígitos verificadores
  let length = numbers.length - 2
  let digits = numbers.substring(0, length)
  const checkDigits = numbers.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(checkDigits.charAt(0))) return false
  
  length = length + 1
  digits = numbers.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(checkDigits.charAt(1))) return false
  
  return true
}

/**
 * Valida CEP
 */
export const validateCEP = (cep: string): boolean => {
  if (!cep) return false
  const numbers = unmask(cep)
  return numbers.length === 8
}

/**
 * Valida URL
 */
export const validateUrl = (url: string): boolean => {
  if (!url) return false
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Valida username (apenas letras, números, pontos e underscores)
 */
export const validateUsername = (username: string): boolean => {
  if (!username) return false
  // Entre 3 e 30 caracteres, apenas letras, números, pontos e underscores
  const usernameRegex = /^[a-z0-9._]{3,30}$/
  return usernameRegex.test(username.toLowerCase())
}

// ============================================
// LIMITES E TRUNCAMENTO
// ============================================

/**
 * Limita o tamanho de uma string
 */
export const limitLength = (value: string, maxLength: number): string => {
  if (!value) return ''
  if (value.length <= maxLength) return value
  return value.substring(0, maxLength)
}

/**
 * Handler genérico para inputs com sanitização e limite
 */
export const createSafeInputHandler = (
  setValue: (value: string) => void,
  options: {
    maxLength?: number
    mask?: (value: string) => string
    sanitize?: boolean
    allowSpecialChars?: string[]
  } = {}
) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value
    
    // Sanitiza se necessário
    if (options.sanitize !== false) {
      value = options.allowSpecialChars
        ? sanitizeText(value, options.allowSpecialChars)
        : sanitizeInput(value)
    }
    
    // Aplica máscara se fornecida
    if (options.mask) {
      value = options.mask(value)
    }
    
    // Limita tamanho
    if (options.maxLength) {
      value = limitLength(value, options.maxLength)
    }
    
    setValue(value)
  }
}

// ============================================
// CONSTANTES DE LIMITES
// ============================================

export const INPUT_LIMITS = {
  NAME: 100,
  EMAIL: 255,
  PHONE: 15, // Com máscara: (00) 00000-0000
  CPF: 14, // Com máscara: 000.000.000-00
  CNPJ: 18, // Com máscara: 00.000.000/0000-00
  CEP: 9, // Com máscara: 00000-000
  CAU: 20,
  USERNAME: 30,
  BIO: 500,
  ADDRESS: 200,
  WEBSITE: 2048,
  INSTAGRAM: 30,
  FACEBOOK: 50,
  SPECIALTY: 100,
  EDUCATION: 200,
  AWARDS: 1000,
  EXPERIENCE: 50,
  LOCATION: 100,
  COMPANY_NAME: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const

