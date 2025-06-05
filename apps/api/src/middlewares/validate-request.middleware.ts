import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError, FieldValidationError, UnknownFieldsError, AlternativeValidationError, GroupedAlternativeValidationError } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error: ValidationError) => {
    let field: string | undefined = undefined;
    let value: any = undefined;
    let message = error.msg; // Default message

    if (error.type === 'field') {
      const fieldError = error as FieldValidationError;
      field = fieldError.path;
      value = fieldError.value;
    } else if (error.type === 'unknown_fields') {
      const unknownFieldsError = error as UnknownFieldsError;
      // Message for unknown_fields might be generic, or list the fields
      field = unknownFieldsError.fields.map(f => f.path).join(', ');
      message = `Champs inconnus ou non autorisés: ${field}`;
      // Value might be an array of the unknown field values
      value = unknownFieldsError.fields.map(f => f.value);
    } else if (error.type === 'alternative') {
      const alternativeError = error as AlternativeValidationError;
      // For alternative errors, the message is usually sufficient.
      // It contains nestedErrors which are arrays of FieldValidationErrors.
      // We could try to extract a field from the first nested error if needed.
      field = 'alternative_group'; // Or some other generic identifier
      message = alternativeError.msg; // msg is "Invalid value(s) for alternative group"
                                      // nestedErrors[0][0].path could give a more specific field
    } else if (error.type === 'alternative_grouped') {
        const groupedAlternativeError = error as GroupedAlternativeValidationError;
        field = 'grouped_alternative_group';
        message = groupedAlternativeError.msg;
    }
    // Fallback for any other error types or if 'param' was intended from an older version/custom setup
     else if ((error as any).param) {
      field = (error as any).param;
      value = (error as any).value;
    }


    return {
      field: field || 'general_validation_error',
      message: message,
      value: value,
    };
  });

  res.status(400).json({
    status: 'error',
    message: 'Erreur de validation des données',
    errors: formattedErrors,
  });
};
