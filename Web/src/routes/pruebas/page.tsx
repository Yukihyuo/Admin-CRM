import ProtectedModule from '@/components/global/ProtectedModule'
import { useAuthStore } from '@/store/authStore'
import React from 'react'

export default function Page() {
  const { getRole, getModules } = useAuthStore()
  return (
    <div className='p-4 bg-red-500 ' >
      <ProtectedModule page="Pruebas" type='read' method="block">

        <button type="button" onClick={() => {
          console.log(getRole())
        }} >Hola</button>


        <button type="button" onClick={() => {
          console.log(getModules())
        }} >Modulos</button>

      </ProtectedModule>


    </div>
  )
}
