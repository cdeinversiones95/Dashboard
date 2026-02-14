import { supabase } from '../config/supabase';

/**
 * Servicio para manejar uploads de archivos a Supabase Storage
 */
class UploadService {

  /**
   * Verificar si el bucket existe y está configurado correctamente
   */
  static async checkBucketAccess(bucketName = 'payment-receipts') {
    try {
      // Intentar listar archivos del bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });

      if (error) {
        console.error('❌ Error accediendo bucket:', error);
        return { 
          success: false, 
          error: error.message,
          needsSetup: error.message.includes('not found') || error.message.includes('does not exist')
        };
      }

      return { success: true, error: null, needsSetup: false };

    } catch (err) {
      console.error('❌ Error verificando bucket:', err);
      return { 
        success: false, 
        error: err.message, 
        needsSetup: true 
      };
    }
  }

  /**
   * Subir imagen de comprobante de pago
   */
  static async uploadPaymentReceipt(imageUri, depositId, paymentType = 'usdt') {
    try {
      // 1. Verificar sesión de usuario
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Error de sesión: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error('Usuario no autenticado. Por favor inicia sesión.');
      }

      // 2. Verificar acceso al bucket
      const bucketCheck = await this.checkBucketAccess('payment-receipts');
      if (!bucketCheck.success) {
        if (bucketCheck.needsSetup) {
          throw new Error('El sistema de almacenamiento no está configurado. Contacta soporte técnico.');
        }
        throw new Error(`Error de almacenamiento: ${bucketCheck.error}`);
      }

      // 3. Preparar archivo
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const fileName = `comprobantes/${paymentType}_${depositId}_${timestamp}.${fileExtension}`;
      
      // 4. Convertir imagen para React Native
      const mimeType = fileExtension.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
      
      // Leer la imagen como ArrayBuffer (más compatible con React Native)
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error('No se pudo leer la imagen seleccionada');
      }
      
      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('La imagen es demasiado grande. Máximo 10MB.');
      }

      // 5. Subir archivo usando ArrayBuffer
      let uploadResult = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: false // No sobrescribir si existe
        });

      let uploadData = uploadResult.data;
      let uploadError = uploadResult.error;

      if (uploadError) {
        console.error('❌ Error en upload:', uploadError);
        
        // Mensajes específicos por tipo de error
        if (uploadError.message.includes('already exists')) {
          // Generar nuevo nombre y reintentar
          const retryFileName = `comprobantes/${paymentType}_${depositId}_${timestamp}_retry.${fileExtension}`;
          
          const retryResult = await supabase.storage
            .from('payment-receipts')
            .upload(retryFileName, arrayBuffer, {
              contentType: mimeType,
              upsert: false
            });

          if (retryResult.error) {
            throw new Error(`Error en reintento: ${retryResult.error.message}`);
          }
          
          uploadData = retryResult.data;
        } else {
          throw new Error(`Error subiendo archivo: ${uploadError.message}`);
        }
      }

      // 6. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(uploadData.path);

      return {
        success: true,
        url: publicUrl,
        path: uploadData.path,
        fileName: fileName
      };

    } catch (error) {
      console.error('❌ Error en uploadPaymentReceipt:', error);
      return {
        success: false,
        error: error.message,
        url: null,
        path: null
      };
    }
  }

  /**
   * Actualizar registro de depósito con comprobante
   */
  static async updateDepositWithReceipt(depositId, receiptUrl, reference = '') {
    try {
      const { error: updateError } = await supabase
        .from('pending_deposits')
        .update({ 
          reference_number: reference,
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (updateError) {
        throw new Error(`Error actualizando registro: ${updateError.message}`);
      }

      return { success: true, error: null };

    } catch (error) {
      console.error('❌ Error actualizando depósito:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Proceso completo: subir comprobante y actualizar depósito
   */
  static async uploadAndUpdateDeposit(imageUri, depositId, reference = '', paymentType = 'usdt') {
    try {
      // 1. Subir imagen
      const uploadResult = await this.uploadPaymentReceipt(imageUri, depositId, paymentType);
      
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // 2. Actualizar depósito
      const updateResult = await this.updateDepositWithReceipt(depositId, uploadResult.url, reference);
      
      if (!updateResult.success) {
        // TODO: Considerar eliminar imagen subida si falla la actualización
        return { success: false, error: updateResult.error };
      }

      return { 
        success: true, 
        url: uploadResult.url,
        path: uploadResult.path 
      };

    } catch (error) {
      console.error('❌ Error en proceso completo:', error);
      return { success: false, error: error.message };
    }
  }
}

export default UploadService;