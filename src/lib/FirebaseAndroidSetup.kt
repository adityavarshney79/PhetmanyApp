package com.example.phetmany.data

import com.google.firebase.Firebase
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.firestore

/**
 * Firebase Firestore Initialization for Android (Kotlin)
 * 
 * Target Firestore Database ID: ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b
 * 
 * Put this in your Android project (e.g. in FirebaseProvider.kt or Repository class)
 */
object FirebaseProvider {

    // Initialize Firestore pointing to the custom database ID
    val db: FirebaseFirestore by lazy {
        Firebase.firestore("ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b")
    }

    /**
     * Example function to fetch all products from Firestore database
     */
    fun fetchProducts(onSuccess: (List<Map<String, Any>>) -> Unit, onFailure: (Exception) -> Unit) {
        db.collection("products")
            .get()
            .addOnSuccessListener { result ->
                val products = result.map { document ->
                    document.data
                }
                onSuccess(products)
            }
            .addOnFailureListener { exception ->
                onFailure(exception)
            }
    }
}
