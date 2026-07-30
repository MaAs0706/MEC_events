export function signOut(navigate) {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')

  navigate('/login')
}
