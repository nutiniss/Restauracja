package com.solution.invoice

import android.content.ContentValues
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class InvoicePdfModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "InvoicePdf"

  @ReactMethod
  fun saveInvoicePdf(fileName: String, base64Pdf: String, promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        throw IllegalStateException(
          "Zapisywanie faktur wymaga Androida 10 lub nowszego."
        )
      }

      val safeFileName = fileName
        .replace(Regex("[^a-zA-Z0-9._-]"), "_")
        .ifBlank { "faktura.pdf" }
        .let { if (it.endsWith(".pdf", ignoreCase = true)) it else "$it.pdf" }
      val pdfBytes = Base64.decode(base64Pdf, Base64.DEFAULT)
      val resolver = reactContext.contentResolver
      val values = ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, safeFileName)
        put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        put(MediaStore.Downloads.IS_PENDING, 1)
      }
      val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
        ?: throw IllegalStateException("Nie można utworzyć pliku PDF.")

      resolver.openOutputStream(uri)?.use { outputStream ->
        outputStream.write(pdfBytes)
      } ?: throw IllegalStateException("Nie można zapisać pliku PDF.")

      val completedValues = ContentValues().apply {
        put(MediaStore.Downloads.IS_PENDING, 0)
      }
      resolver.update(uri, completedValues, null, null)

      val viewIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/pdf")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      if (viewIntent.resolveActivity(reactContext.packageManager) != null) {
        val chooser = Intent.createChooser(viewIntent, "Otwórz fakturę").apply {
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        currentActivity?.startActivity(chooser) ?: reactContext.startActivity(
          chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }

      promise.resolve(uri.toString())
    } catch (error: Exception) {
      promise.reject("INVOICE_PDF_SAVE_FAILED", error.message, error)
    }
  }
}
