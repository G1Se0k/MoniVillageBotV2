import { userRegister } from './userRegister';
import { role } from './role';
import { mbti } from './mbti';
import { nickname } from './nickname';
import { myInfo } from './myInfo';
import { userAdmin } from './userAdmin';

const availableCommands = [userRegister, role, mbti, nickname, myInfo, userAdmin];

export default availableCommands;