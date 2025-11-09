import { signOut } from "next-auth/react";

export async function federatedLogout() {
  try {
    // Call the federated logout endpoint to get the Keycloak logout URL
    const response = await fetch("/api/auth/federated-logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      
      // If we have a logout URL, redirect to Keycloak for federated logout
      if (data.logoutUrl) {
        // Sign out from NextAuth first (this clears the session)
        await signOut({ redirect: false });
        
        // Then redirect to Keycloak's logout endpoint
        window.location.href = data.logoutUrl;
        return;
      }
    }

    // Fallback to regular sign out if federated logout fails
    await signOut({ callbackUrl: "/", redirect: true });
  } catch (error) {
    console.error("Error during federated logout:", error);
    // Fallback to regular sign out
    await signOut({ callbackUrl: "/", redirect: true });
  }
}

