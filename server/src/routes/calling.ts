import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { securityService } from '../services/securityService';

const router = Router();

// Endpoint de Llamada Segura
router.post('/api/secure-call', async (req: Request, res: Response) => {
  try {
    const { contactName, userContacts, pin, storedPINHash, userId = 'default' } = req.body;

    console.log(`📞 Procesando solicitud de llamada segura para: ${contactName}`);

    // Registro inicial de auditoría
    securityService.logAudit('CALL_REQUEST_START', { contactName, userId });

    // 1. Análisis de Comportamiento
    const behavior = securityService.analyzeBehavior(contactName, userId);
    if (behavior.suspicious) {
      securityService.logAudit('SECURITY_ALERT', behavior);
      return res.status(403).json({ success: false, error: behavior.reason });
    }

    // 2. Validación de PIN
    const isPinValid = securityService.verifyPIN(pin, storedPINHash);
    if (!isPinValid) {
      securityService.logAudit('AUTH_FAILURE', { type: 'PIN', userId });
      return res.status(401).json({ success: false, error: 'PIN de seguridad incorrecto' });
    }

    // 3. Confirmación Final
    securityService.logAudit('CALL_AUTHORIZED', { contactName, userId });
    
    res.json({
      success: true,
      message: 'Autorización concedida',
      auditToken: crypto.randomBytes(16).toString('hex')
    });

  } catch (error) {
    console.error('Error en Secure Call:', error);
    res.status(500).json({ success: false, error: 'Error interno de seguridad' });
  }
});

export default router;
