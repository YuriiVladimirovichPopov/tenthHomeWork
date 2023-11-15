import { Request, Response, Router } from "express";
import { sendStatus } from "./send-status";
import { authService } from '../domain/auth-service';
import { usersRepository } from '../repositories/users-repository';
import { deviceRepository } from '../repositories/device-repository';

export const securityRouter = Router({})

securityRouter.get('/devices', async (req: Request, res: Response) => {
 const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(sendStatus.UNAUTHORIZED_401).send({message: "Refresh token not found"})
  }
 
 const isValid = await authService.validateRefreshToken(refreshToken)
  if (!isValid || !isValid.userId || !isValid.deviceId) {
    return res.status(sendStatus.UNAUTHORIZED_401).send({message: "Invalid refresh token"})
  }

 const user = await usersRepository.findUserById(isValid.userId)
  if (!user) {
    return res.status(sendStatus.UNAUTHORIZED_401).send({message: "User not found"})
  }
  
  /* const device = await deviceRepository.findDeviceByUser(isValid.userId) // been deviceId
  console.log(device, "devices found!")
    if (!device || device.lastActiveDate !== await jwtService.getLastActiveDate(refreshToken)) { //
      return res.status(sendStatus.UNAUTHORIZED_401).send({message: "Device not found"})
    } 
// тут валится
    if (isValid.userId !== device.userId) {
      return res.status(sendStatus.UNAUTHORIZED_401).send({message: "Unathorized access to device"})
    }
 */
  const result = await deviceRepository.getAllDevicesByUser(isValid.userId)
    if (!result) {
      res.status(sendStatus.UNAUTHORIZED_401)
    } else {
      res.status(sendStatus.OK_200).send(result)
    }
})

securityRouter.delete('/devices',async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken
  const isValid = await authService.validateRefreshToken(refreshToken)
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res.status(sendStatus.UNAUTHORIZED_401).send({message: "Unathorized" })
    }
  
  const result = await deviceRepository.deleteAllDevicesExceptCurrent(isValid.userId, isValid.deviceId)
  if (result) {
    res.status(sendStatus.NO_CONTENT_204).send({message: "Device" }) // TODO
  } else {
    res.status(sendStatus.INTERNAL_SERVER_ERROR_500).send({message: "Device!"}) // TODO
  }
})

securityRouter.delete('/devices/:deviceId',async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken
  const deviceId = req.params.deviceId
  const isValid = await authService.validateRefreshToken(refreshToken)

    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res.status(sendStatus.UNAUTHORIZED_401).send({message: "Unauthorized"})
    }
    
  const user = await usersRepository.findUserById(isValid.userId)
    if (!user) {
      return res.status(sendStatus.UNAUTHORIZED_401).send({message: "User not found"})
    }

  const device = await deviceRepository.findDeviceByUser(deviceId)
    if (!device) {
      return res.status(sendStatus.NOT_FOUND_404).send({message: "Device not found"})
    }
    if (device.userId !== isValid.userId) {
      return res.status(sendStatus.FORBIDDEN_403).send({message: "Device's ID is not valid"})
    }

  await deviceRepository.deleteDeviceById(deviceId)
    return res.status(sendStatus.NO_CONTENT_204).send({message: "delete"})  //здесь подправить мессадж
})