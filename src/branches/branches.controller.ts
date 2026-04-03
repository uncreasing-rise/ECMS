import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
	constructor(private readonly branchesService: BranchesService) {}

	@Get()
	findAll() {
		return this.branchesService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.branchesService.findOne(id);
	}

	@Post()
	create(@Body() dto: CreateBranchDto) {
		return this.branchesService.create(dto);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
		return this.branchesService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.branchesService.remove(id);
	}
}
