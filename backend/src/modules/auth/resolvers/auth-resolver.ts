import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { env } from '../../../config/env';
import { AdminLoginInput } from '../dto/admin-login-input';
import { EmployeeType, toEmployeeType } from '../dto/employee-type';
import { LogInInput } from '../dto/log-in-input';
import { SignUpInput } from '../dto/sign-up-input';
import { Employee } from '../entities/employee';
import { AuthService } from '../services/auth-service';
import { SESSION_COOKIE, signToken, tokenMaxAgeMs } from '../utils/jwt';

@Resolver()
export class AuthResolver {
  private readonly authService = new AuthService();

  @Mutation(() => EmployeeType)
  async signUp(
    @Arg('input', () => SignUpInput) input: SignUpInput,
    @Ctx() ctx: AppContext,
  ): Promise<EmployeeType> {
    const employee = await this.authService.signUp(input);
    this.createSession(ctx, employee);
    return toEmployeeType(employee);
  }

  @Mutation(() => EmployeeType)
  async logIn(
    @Arg('input', () => LogInInput) input: LogInInput,
    @Ctx() ctx: AppContext,
  ): Promise<EmployeeType> {
    const employee = await this.authService.logIn(input.email, input.password);
    this.createSession(ctx, employee);
    return toEmployeeType(employee);
  }

  @Mutation(() => EmployeeType)
  async adminLogin(
    @Arg('input', () => AdminLoginInput) input: AdminLoginInput,
    @Ctx() ctx: AppContext,
  ): Promise<EmployeeType> {
    const employee = await this.authService.adminLogIn(
      input.email,
      input.password,
    );
    this.createSession(ctx, employee);
    return toEmployeeType(employee);
  }

  @Mutation(() => Boolean)
  @Authorized()
  async logout(@Ctx() ctx: AppContext): Promise<boolean> {
    ctx.res.clearCookie(SESSION_COOKIE);
    return true;
  }

  @Query(() => EmployeeType)
  @Authorized()
  async currentUser(@Ctx() ctx: AppContext): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(
      ctx.user ? ctx.user.id : null,
    );
    return toEmployeeType(employee);
  }

  private createSession(ctx: AppContext, employee: Employee): void {
    const token = signToken({ id: employee.id, role: employee.role });
    ctx.res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: tokenMaxAgeMs(),
    });
  }
}
