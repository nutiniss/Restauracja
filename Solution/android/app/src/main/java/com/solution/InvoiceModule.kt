package com.solution

import android.content.Intent
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class InvoiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "InvoiceModule"

  @ReactMethod
  fun sharePdf(fileName: String, base64Pdf: String, promise: Promise) {
    try {
      val safeFileName = fileName.replace(Regex("[^A-Za-z0-9._-]"), "_")
      val invoiceDirectory = File(reactContext.cacheDir, "invoices")
      invoiceDirectory.mkdirs()

      val invoiceFile = File(invoiceDirectory, safeFileName)
      invoiceFile.writeBytes(Base64.decode(base64Pdf, Base64.DEFAULT))

      val uri = FileProvider.getUriForFile(
          reactContext,
          "${reactContext.packageName}.fileprovider",
          invoiceFile,
      )
      val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = "application/pdf"
        putExtra(Intent.EXTRA_STREAM, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooser = Intent.createChooser(shareIntent, "Udostępnij fakturę").apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      reactContext.startActivity(chooser)
      promise.resolve(null)
    } catch (exception: Exception) {
      promise.reject("INVOICE_SHARE_FAILED", exception)
    }
  }
}
