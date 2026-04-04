import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
	constructor(private readonly branchesService: BranchesService) {}

	@Get()
	findAll(@Query() query: PaginationQueryDto) {
		return this.branchesService.findAll(query.page, query.limit);
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
