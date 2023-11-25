import { body } from "express-validator"
import { inputValidationErrors } from "../input-validation-middleware"; 
import { usersRepository } from '../../repositories/users-repository';

    const emailConfirmationValidation = body('email')
                                                    .isString()
                                                    .trim()
                                                    .isEmail()
                                                    .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
                                                    .withMessage('incorrect email')
                                                    /* /* .custom(async (email) => {
                                                        const user = await usersRepository.findByLoginOrEmail(email);
                                                        if (!user) {
                                                            throw Error(`'User doesn't exist'`);
                                                        }
                                                        if (user.emailConfirmation.isConfirmed) {
                                                            throw Error('email by user already confirmed');
                                                        }
                                                        return true; 
                                                        }) */
    /* const recoveryCodeByEmail = body('email')
                                            .isString()
                                            .withMessage('must be a valid email')
                                            .trim()
                                            .isEmail()
                                            /* .custom(async (email) => {
                                                const user = await usersRepository.findUserByEmail(email)
                                                if (!user) {
                                                    throw new Error ('User with this email not found')
                                                }
                                                return true 
                                            })*/
 
export const emailConfValidation = [emailConfirmationValidation, inputValidationErrors]
export const emailWithRecoveryCodeValidation = [ inputValidationErrors]