import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as Contacts from 'expo-contacts';
import { Linking } from 'react-native';

interface CallSecurityState {
  isActive: boolean;
  step: 'idle' | 'awaiting_confirmation' | 'awaiting_pin' | 'calling';
  contactName: string | null;
  phoneNumber: string | null;
  error: 'call' | 'whatsapp' | null;
}

export function useSecureCall() {
  const [isActive, setIsActive] = useState(false);
  const stateRef = useRef<CallSecurityState>({
    isActive: false,
    step: 'idle',
    contactName: null,
    phoneNumber: null,
    error: null,
  });

  useEffect(() => {
    Contacts.requestPermissionsAsync();
  }, []);

  const handleSecureCall = async (
    userMessage: string, 
    setJarvisResponse: (msg: string) => void, 
    speakResponse: (msg: string) => Promise<void>
  ) => {
    const message = userMessage.toLowerCase().trim();
    const currentState = stateRef.current;
    
    console.log(`🔍 [DEBUG] Paso Actual: ${currentState.step} | Mensaje: "${message}"`);

    // ESTADO: Comienzo (Llamada o WhatsApp)
    if (currentState.step === 'idle') {
      if (message.includes('confirmas la') || message.includes('protocolo')) return true;

      const isWhatsApp = message.includes('whatsapp') || message.includes('mensaje') || message.includes('escribe');
      const nameMatch = message.match(/(?:llam|marc|contact|call|phone|dial|envía|manda|escribe|enviar)\w*\s+(?:a\s+)?([\w\sáéíóúÁÉÍÓÚñÑ]+)/i);
      
      if (!nameMatch) return false;

      const contactName = nameMatch[1].trim();
      const { data: allContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const foundContact = allContacts.find(c => 
        `${c.firstName || ''} ${c.lastName || ''} ${c.name || ''}`.toLowerCase().includes(contactName.toLowerCase())
      );

      if (!foundContact || !foundContact.phoneNumbers?.[0]?.number) {
        setJarvisResponse(`No encontré a ${contactName}.`);
        await speakResponse(`No encontré a ${contactName}.`);
        return true;
      }

      stateRef.current = {
        isActive: true,
        step: 'awaiting_confirmation',
        contactName: foundContact.name || contactName,
        phoneNumber: foundContact.phoneNumbers[0].number.replace(/\D/g, ''),
        error: isWhatsApp ? 'whatsapp' : 'call'
      };
      setIsActive(true);

      const actionText = isWhatsApp ? 'enviar un WhatsApp' : 'llamar';
      const response = `Entendido. Iniciando protocolo para ${actionText} a ${stateRef.current.contactName}. ¿Confirmas la acción?`;
      setJarvisResponse(response);
      await speakResponse(response);
      return true;
    }

    // ESTADO: Confirmación
    if (currentState.step === 'awaiting_confirmation') {
      if (message.includes('sí') || message.includes('si') || message.includes('yes') || message.includes('confirmado') || message.includes('dale')) {
        stateRef.current.step = 'awaiting_pin';
        const response = `Identidad confirmada. Por favor, dime tu código de seguridad de cuatro dígitos.`;
        setJarvisResponse(response);
        await speakResponse(response);
      } else if (message.includes('no') || message.includes('cancelar')) {
        stateRef.current = { isActive: false, step: 'idle', contactName: null, phoneNumber: null, error: null };
        setIsActive(false);
        setJarvisResponse("Protocolo cancelado.");
        await speakResponse("Protocolo cancelado.");
      } else {
        const retry = `¿Confirmas la acción para ${currentState.contactName}? Di sí o no.`;
        setJarvisResponse(retry);
        await speakResponse(retry);
      }
      return true;
    }

    // ESTADO: PIN y Ejecución
    if (currentState.step === 'awaiting_pin') {
      let cleanMessage = message
        .replace(/uno/g, '1').replace(/dos/g, '2').replace(/tres/g, '3').replace(/cuatro/g, '4')
        .replace(/cinco/g, '5').replace(/seis/g, '6').replace(/siete/g, '7').replace(/ocho/g, '8')
        .replace(/nueve/g, '9').replace(/cero/g, '0');
      
      const pin = cleanMessage.replace(/\D/g, '');
      
      if (pin.includes('1234')) {
        stateRef.current.step = 'calling';
        const isWhatsApp = currentState.error === 'whatsapp';
        
        if (isWhatsApp) {
          const response = `Código correcto. Abriendo WhatsApp para ${currentState.contactName}.`;
          setJarvisResponse(response);
          await speakResponse(response);
          Linking.openURL(`whatsapp://send?phone=${currentState.phoneNumber}`);
        } else {
          const response = `Código correcto. Llamando a ${currentState.contactName}.`;
          setJarvisResponse(response);
          await speakResponse(response);
          Linking.openURL(`tel:${currentState.phoneNumber}`);
        }
        
        setTimeout(() => {
          stateRef.current = { isActive: false, step: 'idle', contactName: null, phoneNumber: null, error: null };
          setIsActive(false);
        }, 3000);
      } else {
        const response = `Código incorrecto. Repítelo por favor.`;
        setJarvisResponse(response);
        await speakResponse(response);
      }
      return true;
    }

    return false;
  };

  return { isActive, handleSecureCall };
}
