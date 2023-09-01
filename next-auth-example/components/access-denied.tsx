import { signIn } from "next-auth/react"

export default function AccessDenied() {
  return (
    <>
      <h1 data-id={"access-denied"}>Access Denied</h1>
      <p>
        <a
          data-id={"access-link"}
          href="/api/auth/signin"
          onClick={(e) => {
            e.preventDefault()
            signIn()
          }}
        >
          You must be signed in to view this page
        </a>
      </p>
    </>
  )
}
