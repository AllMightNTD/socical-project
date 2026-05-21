import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../guards/auth.guard';
import { UserService } from '../user/user.service';
import { ChatService } from './chat.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './public/uploads/chat';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) { }

  @Get('/conversation/:friendId')
  async getOrCreateConversation(@Request() req, @Param('friendId') friendId: string) {
    return this.userService.getOrCreateConversation(req.user.sub, friendId);
  }

  @Get('/messages/:conversationId')
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // Kiểm tra xem user có trong conversation này không
    const isParticipant = await this.chatService.checkParticipant(req.user.sub, conversationId);
    if (!isParticipant) {
      return { data: [], total: 0 };
    }

    return this.chatService.getMessages(conversationId, page, limit);
  }

  @Post('/upload')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage,
      limits: { fileSize: 500 * 1024 * 1024 }, // Tối đa 500MB
      fileFilter: (req, file, cb) => {
        const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const allowedVideoExts = ['.mp4', '.mov', '.webm'];
        const ext = extname(file.originalname).toLowerCase();
        
        if (allowedImageExts.includes(ext) || allowedVideoExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      }
    }),
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const metadata = files.map(file => {
      const fileUrl = `/uploads/chat/${file.filename}`;
      const isVideo = file.mimetype.startsWith('video/') || ['.mp4', '.mov', '.webm'].includes(extname(file.filename).toLowerCase());
      const fileType = isVideo ? 'video' : 'image';

      // Validate size
      if (isVideo && file.size > 500 * 1024 * 1024) {
        throw new BadRequestException('Video size must be less than 500MB');
      }
      if (!isVideo && file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image size must be less than 5MB');
      }

      return {
        file_url: fileUrl,
        type: fileType,
        filename: file.originalname,
      };
    });

    return { metadata };
  }
}
