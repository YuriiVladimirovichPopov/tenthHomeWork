import { ObjectId} from "mongodb";
import { UsersMongoDbType } from '../types';
import { UserPagination } from "../routers/helpers/pagination";
import { UserViewModel } from '../models/users/userViewModel';
import { PaginatedUser } from "../models/users/paginatedQueryUser";
import { UserCreateViewModel } from "../models/users/createUser";
import { UserModel } from "../schemas/users.schema";
import { authService } from '../domain/auth-service';


export const usersRepository = {

    _userMapper(user: UsersMongoDbType): UserViewModel {
        return {
            id: user._id.toString(),
            login: user.login,
            email: user.email,             
            createdAt: user.createdAt,
            emailConfirmation: user.emailConfirmation
        }
    },

    async findAllUsers(pagination: UserPagination): Promise<PaginatedUser<UserViewModel[]>> {
        let filter = {};
        if(pagination.searchEmailTerm && pagination.searchLoginTerm){
            filter = { $or:[{email: {$regex: pagination.searchEmailTerm, $options: 'i'}}, 
                            {login: {$regex: pagination.searchLoginTerm, $options: 'i'}}]}
        }
        else if (pagination.searchEmailTerm ) {
            filter = {email:  { $regex: pagination.searchEmailTerm, $options: 'i'} }              
        }
        else if (pagination.searchLoginTerm) {
            filter = {login: { $regex: pagination.searchLoginTerm, $options: 'i'}}
        }

        const result: UsersMongoDbType[] =
        await UserModel.find(filter, {projection: 
            {passwordSalt: 0, passwordHash: 0}}) 
            
          .sort({[pagination.sortBy]: pagination.sortDirection})
          .skip(pagination.skip)
          .limit(pagination.pageSize)
          .lean()
                   
          const totalCount: number = await UserModel.countDocuments(filter)
          const pageCount: number = Math.ceil(totalCount / pagination.pageSize)
    
          const res: PaginatedUser<UserViewModel[]> = {
            pagesCount: pageCount,
            page: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: totalCount,
            items: result.map(b => this._userMapper(b))
            }
          return res
    },

    async findUserById(id: string): Promise<UserViewModel | null> {
        const userById = await UserModel.findOne(
            {_id: new ObjectId(id)}, 
            {  projection: {passwordSalt: 0, 
                            passwordHash: 0, 
                            emailConfirmation: 0, 
                            refreshTokenBlackList: 0}})
        if(!userById) {
            return null
        }
            return this._userMapper(userById)
    }, 
    
    async findByLoginOrEmail(loginOrEmail: string) {
        const user = await UserModel.findOne({$or: [{email: loginOrEmail}, {login: loginOrEmail}]}).lean()
        return user
    },

    async findUserByEmail(email: string) {
        const user = await UserModel.findOne({email: email}).lean()
        return user
    },

    async findUserByConfirmationCode(emailConfirmationCode: string) {
        const user = await UserModel.findOne({"emailConfirmation.confirmationCode": emailConfirmationCode}).lean()
        return user
    },
    
    async createUser(newUser: UsersMongoDbType): Promise<UserCreateViewModel> { 
        await UserModel.insertMany(newUser)
        return {
            id: newUser._id.toString(),
            login: newUser.login,
            email: newUser.email,
            createdAt: newUser.createdAt,
        }
    },

    async deleteUser(id: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) {
            return false
        }
        
        const foundUserById = await UserModel.deleteOne({_id: new ObjectId(id)})
        
        return foundUserById.deletedCount === 1
    }, 
   
    async deleteAllUsers(): Promise<boolean> {
        try {
            const result = await UserModel.deleteMany({});
            return result.acknowledged === true
        } catch (error) {
            return false
        }
    },

    async resetPasswordWithRecoveryCode( _id:string, newPassword: string): Promise<any> {
      
        const newHashedPassword = await authService.hashPassword(newPassword);

        await UserModel.updateOne({ _id }, { $set: { passwordHash: newHashedPassword, recoveryCode: null} });
       
        return { success: true };
    }
}



